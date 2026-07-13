import * as fs from "fs";
import * as path from "path";
import { resolveVaultPath, type PathErrorCode } from "./path-safety";

export type NoteFileErrorCode = PathErrorCode | "VAULT_NOT_FOUND" | "VAULT_NOT_DIRECTORY" | "VAULT_NOT_WRITABLE" | "NOT_FOUND" | "ALREADY_EXISTS" | "INVALID_TYPE" | "IO_ERROR";
export type NoteFileResult<T> = { ok: true; value: T } | { ok: false; error: { code: NoteFileErrorCode; message: string } };
export interface NoteListing { notes: string[]; emptyFolders: string[] }

const fail = <T>(code: NoteFileErrorCode, message: string): NoteFileResult<T> => ({ ok: false, error: { code, message } });
const success = <T>(value: T): NoteFileResult<T> => ({ ok: true, value });
const propagate = <T>(result: { ok: false; error: { code: NoteFileErrorCode; message: string } }): NoteFileResult<T> => result;
const slash = (value: string): string => value.split(path.sep).join("/");
const errno = (error: unknown): NodeJS.ErrnoException => error as NodeJS.ErrnoException;

function ioFailure<T>(error: unknown, action: string): NoteFileResult<T> {
  const code = errno(error).code;
  if (code === "ENOENT") return fail("NOT_FOUND", `${action}: the requested item does not exist.`);
  if (code === "EEXIST") return fail("ALREADY_EXISTS", `${action}: the destination already exists.`);
  return fail("IO_ERROR", `${action}: ${errno(error).message || "filesystem operation failed"}`);
}

export async function validateWritableVault(vaultRoot: string): Promise<NoteFileResult<string>> {
  try {
    const stats = await fs.promises.stat(vaultRoot);
    if (!stats.isDirectory()) return fail("VAULT_NOT_DIRECTORY", "The vault must be a directory.");
    await fs.promises.access(vaultRoot, fs.constants.R_OK | fs.constants.W_OK);
    return success(await fs.promises.realpath(vaultRoot));
  } catch (error) {
    if (errno(error).code === "ENOENT") return fail("VAULT_NOT_FOUND", "The vault does not exist.");
    if (errno(error).code === "EACCES" || errno(error).code === "EPERM") return fail("VAULT_NOT_WRITABLE", "The vault is not writable.");
    return ioFailure(error, "Validate vault");
  }
}

async function target(vaultRoot: string, relativePath: string, kind: "file" | "folder"): Promise<NoteFileResult<string>> {
  const vault = await validateWritableVault(vaultRoot);
  if (!vault.ok) return propagate(vault);
  try {
    const resolved = await resolveVaultPath(vault.value, relativePath, kind);
    if (resolved.ok) return success(resolved.value);
    return fail(resolved.code, resolved.message);
  } catch (error) {
    return ioFailure(error, "Resolve path");
  }
}

export async function listNotes(vaultRoot: string): Promise<NoteFileResult<NoteListing>> {
  const vault = await validateWritableVault(vaultRoot);
  if (!vault.ok) return propagate(vault);
  const notes: string[] = [];
  const emptyFolders: string[] = [];
  async function scan(directory: string, prefix = ""): Promise<boolean> {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    let hasVisibleContent = false;
    for (const entry of entries) {
      if (!prefix && entry.name === ".void-trash") continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        const childContent = await scan(path.join(directory, entry.name), relative);
        if (!childContent) emptyFolders.push(relative);
        hasVisibleContent = hasVisibleContent || childContent;
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        notes.push(relative);
        hasVisibleContent = true;
      }
    }
    return hasVisibleContent;
  }
  try {
    await scan(vault.value);
    return success({ notes: notes.sort(), emptyFolders: emptyFolders.sort() });
  } catch (error) { return ioFailure(error, "List notes"); }
}

export async function loadNote(vaultRoot: string, relativePath: string): Promise<NoteFileResult<string>> {
  const resolved = await target(vaultRoot, relativePath, "file");
  if (!resolved.ok) return propagate(resolved);
  try { return success(await fs.promises.readFile(resolved.value, "utf8")); }
  catch (error) { return ioFailure(error, "Load note"); }
}

export async function saveNote(vaultRoot: string, relativePath: string, content: string): Promise<NoteFileResult<void>> {
  const resolved = await target(vaultRoot, relativePath, "file");
  if (!resolved.ok) return propagate(resolved);
  const temporary = `${resolved.value}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.promises.mkdir(path.dirname(resolved.value), { recursive: true });
    await fs.promises.writeFile(temporary, content, "utf8");
    await fs.promises.rename(temporary, resolved.value);
    return success(undefined);
  } catch (error) {
    try { await fs.promises.rm(temporary, { force: true }); } catch {}
    return ioFailure(error, "Save note");
  }
}

export async function createNote(vaultRoot: string, relativePath: string): Promise<NoteFileResult<string>> {
  const notePath = relativePath.toLowerCase().endsWith(".md") ? relativePath : `${relativePath}.md`;
  const resolved = await target(vaultRoot, notePath, "file");
  if (!resolved.ok) return propagate(resolved);
  try {
    await fs.promises.mkdir(path.dirname(resolved.value), { recursive: true });
    const handle = await fs.promises.open(resolved.value, "wx");
    await handle.close();
    return success(slash(notePath));
  } catch (error) { return ioFailure(error, "Create note"); }
}

export async function renameNote(vaultRoot: string, oldRelativePath: string, newName: string): Promise<NoteFileResult<string>> {
  const source = await target(vaultRoot, oldRelativePath, "file");
  if (!source.ok) return propagate(source);
  const fileName = newName.toLowerCase().endsWith(".md") ? newName : `${newName}.md`;
  const relativeDestination = slash(path.join(path.dirname(oldRelativePath), fileName)).replace(/^\.\//, "");
  const destination = await target(vaultRoot, relativeDestination, "file");
  if (!destination.ok) return destination;
  try {
    await fs.promises.access(destination.value);
    return fail("ALREADY_EXISTS", "Rename note: the destination already exists.");
  } catch (error) {
    if (errno(error).code !== "ENOENT") return ioFailure(error, "Rename note");
  }
  try { await fs.promises.rename(source.value, destination.value); return success(relativeDestination); }
  catch (error) { return ioFailure(error, "Rename note"); }
}

export async function trashNote(vaultRoot: string, relativePath: string): Promise<NoteFileResult<{ trashId: string }>> {
  const source = await target(vaultRoot, relativePath, "file");
  if (!source.ok) return propagate(source);
  const trashId = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2)}`;
  const directory = path.join(await fs.promises.realpath(vaultRoot), ".void-trash", trashId);
  try {
    await fs.promises.mkdir(directory, { recursive: true });
    await fs.promises.rename(source.value, path.join(directory, "note.md"));
    await fs.promises.writeFile(path.join(directory, "metadata.json"), JSON.stringify({ originalPath: slash(relativePath) }), "utf8");
    return success({ trashId });
  } catch (error) { try { await fs.promises.rm(directory, { recursive: true, force: true }); } catch {} return ioFailure(error, "Trash note"); }
}

export async function restoreNote(vaultRoot: string, trashId: string): Promise<NoteFileResult<string>> {
  const item = await target(vaultRoot, `.void-trash/${trashId}`, "folder");
  if (!item.ok) return propagate(item);
  try {
    const metadata = JSON.parse(await fs.promises.readFile(path.join(item.value, "metadata.json"), "utf8")) as { originalPath?: unknown };
    if (typeof metadata.originalPath !== "string") return fail("INVALID_TYPE", "Trash metadata is invalid.");
    const destination = await target(vaultRoot, metadata.originalPath, "file");
    if (!destination.ok) return destination;
    try { await fs.promises.access(destination.value); return fail("ALREADY_EXISTS", "Restore note: the destination already exists."); } catch (error) { if (errno(error).code !== "ENOENT") return ioFailure(error, "Restore note"); }
    await fs.promises.mkdir(path.dirname(destination.value), { recursive: true });
    await fs.promises.rename(path.join(item.value, "note.md"), destination.value);
    await fs.promises.rm(item.value, { recursive: true, force: true });
    return success(slash(metadata.originalPath));
  } catch (error) { return ioFailure(error, "Restore note"); }
}

export async function deletePermanently(vaultRoot: string, trashId: string): Promise<NoteFileResult<void>> {
  const item = await target(vaultRoot, `.void-trash/${trashId}`, "folder");
  if (!item.ok) return propagate(item);
  try { await fs.promises.rm(item.value, { recursive: true }); return success(undefined); }
  catch (error) { return ioFailure(error, "Delete permanently"); }
}
