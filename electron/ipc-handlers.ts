import { ipcMain, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import { getMainWindow, createWelcomeFile, approveWindowClose } from "./window";
import { loadConfig, saveConfig } from "./config";
import * as notes from "./note-files";
import { resolveVaultPath, validateEntryName } from "./path-safety";
import { startWatcher, stopWatcher } from "./watcher";
type IpcErrorCode = "NO_VAULT" | "INVALID_ARGUMENT" | "INVALID_NAME" | "OUTSIDE_VAULT" | "SYMLINK_ESCAPE" | "NOT_FOUND" | "ALREADY_EXISTS" | "NOT_WRITABLE" | "CONFLICT" | "IO_ERROR" | "CANCELLED";
type IpcResult<T> = { ok: true; value: T } | { ok: false; error: { code: IpcErrorCode; message: string; retryable: boolean } };
type NoteStat = { mtime: string; birthtime: string; size: number };
type TrashEntry = { id: string; originalPath: string; deletedAt: string };
const IPC_CHANNELS = { vaultSelect: "vault:select", vaultSet: "vault:set", vaultGet: "vault:get", notesList: "notes:list", notesLoad: "notes:load", notesSave: "notes:save", notesCreate: "notes:create", notesDelete: "notes:delete", notesRename: "notes:rename", notesStat: "notes:stat", trashList: "trash:list", trashLoad: "trash:load", trashRestore: "trash:restore", trashDelete: "trash:delete", folderCreate: "folder:create", folderRename: "folder:rename", folderDelete: "folder:delete", appCloseReady: "app:close-ready" } as const;
const ok = <T>(value: T): IpcResult<T> => ({ ok: true, value });
const err = (code: IpcErrorCode, message: string, retryable = false): IpcResult<never> => ({ ok: false, error: { code, message, retryable } });

let vaultPath: string | null = null;
export function getVaultPath(): string | null { return vaultPath; }
export function initVault(): void {
  vaultPath = loadConfig();
  if (vaultPath) {
    createWelcomeFile(vaultPath);
    const win = getMainWindow();
    if (win) startWatcher(vaultPath, win);
  }
}

const codeMap: Record<string, IpcErrorCode> = {
  EMPTY_NAME: "INVALID_NAME", ABSOLUTE_PATH: "OUTSIDE_VAULT", PATH_TRAVERSAL: "OUTSIDE_VAULT",
  INVALID_CHARACTER: "INVALID_NAME", TRAILING_CHARACTER: "INVALID_NAME", RESERVED_NAME: "INVALID_NAME",
  OUTSIDE_VAULT: "OUTSIDE_VAULT", SYMLINK_ESCAPE: "SYMLINK_ESCAPE", NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS", VAULT_NOT_FOUND: "NOT_FOUND", VAULT_NOT_DIRECTORY: "INVALID_ARGUMENT",
  VAULT_NOT_WRITABLE: "NOT_WRITABLE", INVALID_TYPE: "INVALID_ARGUMENT", IO_ERROR: "IO_ERROR",
};
function convert<T>(result: notes.NoteFileResult<T>): IpcResult<T> {
  return result.ok ? ok(result.value) : err(codeMap[result.error.code] ?? "IO_ERROR", result.error.message, result.error.code === "IO_ERROR");
}
function noVault<T>(): IpcResult<T> { return err("NO_VAULT", "Select a vault first."); }
async function withVault<T>(operation: (vault: string) => Promise<IpcResult<T>>): Promise<IpcResult<T>> {
  return vaultPath ? operation(vaultPath) : noVault();
}
async function folderTarget(vault: string, relative: string) {
  const result = await resolveVaultPath(vault, relative, "folder");
  return result.ok ? ok(result.value) : err(codeMap[result.code] ?? "INVALID_ARGUMENT", result.message);
}
async function listTrash(vault: string): Promise<IpcResult<TrashEntry[]>> {
  const root = await folderTarget(vault, ".void-trash");
  if (!root.ok) return root.error.code === "NOT_FOUND" ? ok([]) : root;
  try {
    const entries = await fs.promises.readdir(root.value, { withFileTypes: true });
    const result: TrashEntry[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const metadata = JSON.parse(await fs.promises.readFile(path.join(root.value, entry.name, "metadata.json"), "utf8")) as { originalPath?: unknown };
      if (typeof metadata.originalPath !== "string") continue;
      const stat = await fs.promises.stat(path.join(root.value, entry.name));
      result.push({ id: entry.name, originalPath: metadata.originalPath, deletedAt: stat.birthtime.toISOString() });
    }
    return ok(result.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return ok([]);
    return err("IO_ERROR", (error as Error).message, true);
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle("window:minimize", () => getMainWindow()?.minimize());
  ipcMain.handle("window:maximize", () => { const win = getMainWindow(); win?.isMaximized() ? win.unmaximize() : win?.maximize(); });
  ipcMain.handle("window:close", () => getMainWindow()?.close());
  ipcMain.handle("window:set-background", (_e, color: string) => getMainWindow()?.setBackgroundColor(color));

  ipcMain.handle(IPC_CHANNELS.vaultSelect, async () => {
    const selected = await dialog.showOpenDialog({ properties: ["openDirectory"], title: "Select Vault Folder" });
    if (selected.canceled || !selected.filePaths[0]) return err("CANCELLED", "Vault selection was cancelled.");
    const validated = await notes.validateWritableVault(selected.filePaths[0]);
    if (!validated.ok) return convert(validated);
    vaultPath = validated.value; saveConfig(vaultPath); createWelcomeFile(vaultPath);
    const win = getMainWindow(); if (win) startWatcher(vaultPath, win);
    return ok(vaultPath);
  });
  ipcMain.handle(IPC_CHANNELS.vaultSet, async (_e, value: string) => {
    if (typeof value !== "string") return err("INVALID_ARGUMENT", "Vault path must be a string.");
    const validated = await notes.validateWritableVault(value); if (!validated.ok) return convert(validated);
    vaultPath = validated.value; saveConfig(vaultPath); createWelcomeFile(vaultPath);
    const win = getMainWindow(); if (win) startWatcher(vaultPath, win);
    return ok(vaultPath);
  });
  ipcMain.handle(IPC_CHANNELS.vaultGet, () => ok(vaultPath));

  ipcMain.handle(IPC_CHANNELS.notesList, () => withVault(async v => convert(await notes.listNotes(v))));
  ipcMain.handle(IPC_CHANNELS.notesLoad, (_e, p: string) => withVault(async v => convert(await notes.loadNote(v, p))));
  ipcMain.handle(IPC_CHANNELS.notesSave, (_e, p: string, c: string) => withVault(async v => convert(await notes.saveNote(v, p, c))));
  ipcMain.handle(IPC_CHANNELS.notesCreate, (_e, p = "Untitled") => withVault(async v => convert(await notes.createNote(v, p))));
  ipcMain.handle(IPC_CHANNELS.notesDelete, (_e, p: string) => withVault(async v => convert(await notes.trashNote(v, p))));
  ipcMain.handle(IPC_CHANNELS.notesRename, (_e, p: string, n: string) => withVault(async v => convert(await notes.renameNote(v, p, n))));
  ipcMain.handle(IPC_CHANNELS.notesStat, (_e, p: string) => withVault(async v => {
    const resolved = await resolveVaultPath(v, p, "file"); if (!resolved.ok) return err(codeMap[resolved.code] ?? "INVALID_ARGUMENT", resolved.message);
    try { const s = await fs.promises.stat(resolved.value); return ok<NoteStat>({ mtime: s.mtime.toISOString(), birthtime: s.birthtime.toISOString(), size: s.size }); }
    catch (e) { return err((e as NodeJS.ErrnoException).code === "ENOENT" ? "NOT_FOUND" : "IO_ERROR", (e as Error).message); }
  }));
  ipcMain.handle(IPC_CHANNELS.trashList, () => withVault(listTrash));
  ipcMain.handle(IPC_CHANNELS.trashLoad, (_e, id: string) => withVault(async v => {
    const resolved = await resolveVaultPath(v, `.void-trash/${id}/note.md`, "file");
    if (!resolved.ok) return err(codeMap[resolved.code] ?? "INVALID_ARGUMENT", resolved.message);
    try { return ok(await fs.promises.readFile(resolved.value, "utf-8")); }
    catch (e) { return err((e as NodeJS.ErrnoException).code === "ENOENT" ? "NOT_FOUND" : "IO_ERROR", (e as Error).message); }
  }));
  ipcMain.handle(IPC_CHANNELS.trashRestore, (_e, id: string) => withVault(async v => convert(await notes.restoreNote(v, id))));
  ipcMain.handle(IPC_CHANNELS.trashDelete, (_e, id: string) => withVault(async v => convert(await notes.deletePermanently(v, id))));

  ipcMain.handle(IPC_CHANNELS.folderCreate, (_e, p: string) => withVault(async v => {
    const target = await folderTarget(v, p); if (!target.ok) return target;
    try { await fs.promises.mkdir(target.value); return ok(p); } catch (e) { return err((e as NodeJS.ErrnoException).code === "EEXIST" ? "ALREADY_EXISTS" : "IO_ERROR", (e as Error).message); }
  }));
  ipcMain.handle(IPC_CHANNELS.folderRename, (_e, p: string, name: string) => withVault(async v => {
    const valid = validateEntryName(name, "folder"); if (!valid.ok) return err(codeMap[valid.code] ?? "INVALID_NAME", valid.message);
    const source = await folderTarget(v, p); if (!source.ok) return source;
    const relative = path.posix.join(path.posix.dirname(p.replace(/\\/g, "/")), name).replace(/^\.\//, "");
    const destination = await folderTarget(v, relative); if (!destination.ok) return destination;
    try { await fs.promises.rename(source.value, destination.value); return ok(relative); } catch (e) { return err((e as NodeJS.ErrnoException).code === "EEXIST" ? "ALREADY_EXISTS" : "IO_ERROR", (e as Error).message); }
  }));
  ipcMain.handle(IPC_CHANNELS.folderDelete, (_e, p: string) => withVault(async v => {
    const target = await folderTarget(v, p); if (!target.ok) return target;
    try { await fs.promises.rmdir(target.value); return ok(undefined); } catch (e) { return err((e as NodeJS.ErrnoException).code === "ENOENT" ? "NOT_FOUND" : "IO_ERROR", (e as Error).message); }
  }));
  ipcMain.handle(IPC_CHANNELS.appCloseReady, () => { approveWindowClose(); return ok(undefined); });
}
