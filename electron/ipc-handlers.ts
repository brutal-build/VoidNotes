import { ipcMain, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const MAX_FILE_WRITE_BYTES = 25 * 1024 * 1024;
import log from "electron-log";
import { getMainWindow, createWelcomeFile, approveWindowClose } from "./window";
import { loadConfig, saveConfig } from "./config";
import * as notes from "./note-files";
import { resolveVaultPath, validateEntryName } from "./path-safety";
import { startWatcher, stopWatcher } from "./watcher";
import { handleCheckForUpdates, handleDownloadUpdate, handleInstallUpdate } from "./updater";
import { IPC_CHANNELS, ok, err } from "../src/shared/ipc-contract";
import type { IpcErrorCode, IpcResult, NoteStat, TrashEntry, VaultStats } from "../src/shared/ipc-contract";

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
      try {
        const metadata = JSON.parse(await fs.promises.readFile(path.join(root.value, entry.name, "metadata.json"), "utf8")) as { originalPath?: unknown };
        if (typeof metadata.originalPath !== "string") continue;
        const stat = await fs.promises.stat(path.join(root.value, entry.name));
        result.push({ id: entry.name, originalPath: metadata.originalPath, deletedAt: stat.birthtime.toISOString() });
      } catch {
        // Skip corrupt trash entries instead of failing the whole list.
      }
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
  ipcMain.handle("log:error", (_e, payload: { message: string; stack?: string; timestamp: string }) => {
    log.error("[renderer]", payload.message, payload.stack ?? "");
    return ok(undefined);
  });
  ipcMain.handle(IPC_CHANNELS.filesWrite, (_e, relativePath: string, data: number[]) => withVault(async (v) => {
    if (typeof relativePath !== "string" || !Array.isArray(data)) {
      return err("INVALID_ARGUMENT", "relativePath must be a string and data must be a number array.");
    }
    if (data.length > MAX_FILE_WRITE_BYTES) {
      return err("INVALID_ARGUMENT", `File exceeds maximum size of ${MAX_FILE_WRITE_BYTES} bytes.`);
    }
    const resolved = await resolveVaultPath(v, relativePath, "file");
    if (!resolved.ok) return err(codeMap[resolved.code] ?? "INVALID_ARGUMENT", resolved.message);
    try {
      const dir = path.dirname(resolved.value);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(resolved.value, Buffer.from(data));
      return ok(relativePath);
    } catch (e) {
      return err((e as NodeJS.ErrnoException).code === "ENOENT" ? "NOT_FOUND" : "IO_ERROR", (e as Error).message);
    }
  }));
  ipcMain.handle(IPC_CHANNELS.filesRead, (_e, relativePath: string) => withVault(async (v) => {
    const resolved = await resolveVaultPath(v, relativePath, "file");
    if (!resolved.ok) return err(codeMap[resolved.code] ?? "INVALID_ARGUMENT", resolved.message);
    try {
      const buffer = await fs.promises.readFile(resolved.value);
      return ok(Array.from(buffer));
    } catch (e) {
      return err((e as NodeJS.ErrnoException).code === "ENOENT" ? "NOT_FOUND" : "IO_ERROR", (e as Error).message);
    }
  }));

  // ─── Daily Notes ──────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.dailyNotePath, () => withVault(async (v) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const fileName = `daily/${yyyy}-${mm}-${dd}.md`;
    const resolved = await resolveVaultPath(v, fileName, "file");
    if (!resolved.ok) return err(codeMap[resolved.code] ?? "INVALID_ARGUMENT", resolved.message);
    try {
      // Check if file exists; if not, create it
      try {
        await fs.promises.access(resolved.value);
      } catch {
        // File doesn't exist, create it
        const createResult = await notes.createNote(v, fileName);
        if (!createResult.ok) return convert(createResult);
      }
      return ok(fileName);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  }));

  // ─── Export ────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.exportNote, (_e, notePath: string) => withVault(async (v) => {
    const resolved = await resolveVaultPath(v, notePath, "file");
    if (!resolved.ok) return err(codeMap[resolved.code] ?? "INVALID_ARGUMENT", resolved.message);
    try {
      const defaultName = notePath.split("/").pop() ?? "note.md";
      const result = await dialog.showSaveDialog({
        title: "Export Note as Markdown",
        defaultPath: defaultName,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (result.canceled || !result.filePath) return err("CANCELLED", "Export was cancelled.");
      await fs.promises.copyFile(resolved.value, result.filePath);
      return ok(result.filePath);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  }));

  ipcMain.handle(IPC_CHANNELS.exportVaultZip, () => withVault(async (v) => {
    try {
      const vaultName = path.basename(v);
      const defaultPath = path.join(path.dirname(v), `${vaultName}-backup.zip`);
      const result = await dialog.showSaveDialog({
        title: "Export Vault as ZIP",
        defaultPath: defaultPath,
        filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
      });
      if (result.canceled || !result.filePath) return err("CANCELLED", "Export was cancelled.");
      // Pass paths via env vars to avoid shell injection in PowerShell -Command strings.
      await execFileAsync("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Compress-Archive -LiteralPath $env:VN_ZIP_SRC -DestinationPath $env:VN_ZIP_DST -Force",
      ], {
        env: { ...process.env, VN_ZIP_SRC: v, VN_ZIP_DST: result.filePath },
        windowsHide: true,
      });
      return ok(result.filePath);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  }));

  ipcMain.handle(IPC_CHANNELS.exportNoteHtml, (_e, notePath: string) => withVault(async (v) => {
    const resolved = await resolveVaultPath(v, notePath, "file");
    if (!resolved.ok) return err(codeMap[resolved.code] ?? "INVALID_ARGUMENT", resolved.message);
    try {
      const content = await fs.promises.readFile(resolved.value, "utf8");
      const defaultName = (notePath.split("/").pop() ?? "note").replace(/\.md$/, ".html");
      const result = await dialog.showSaveDialog({
        title: "Export Note as HTML",
        defaultPath: defaultName,
        filters: [{ name: "HTML", extensions: ["html"] }],
      });
      if (result.canceled || !result.filePath) return err("CANCELLED", "Export was cancelled.");
      // Simple HTML wrapper with the raw markdown
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notePath.split("/").pop()?.replace(/\.md$/, "") ?? "Note"}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
    h1, h2, h3 { color: #111; }
    a { color: #7c5cbf; }
  </style>
</head>
<body>
<pre>${content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
</body>
</html>`;
      await fs.promises.writeFile(result.filePath, html, "utf8");
      return ok(result.filePath);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  }));

  // ─── Vault Stats ──────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.vaultStats, () => withVault(async (v) => {
    try {
      const listing = await notes.listNotes(v);
      if (!listing.ok) return convert(listing);
      const { notes: noteList, emptyFolders } = listing.value;
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      const tagRegex = /(?:^|\s)#([\p{L}\p{N}_\/-]+)/gu;
      let totalSizeBytes = 0;
      const tagSet = new Set<string>();
      let wikiLinkCount = 0;
      const mtimes: { path: string; mtime: string }[] = [];
      const allLinks = new Map<string, Set<string>>();

      for (const note of noteList) {
        const resolved = await resolveVaultPath(v, note, "file");
        if (!resolved.ok) continue;
        const stat = await fs.promises.stat(resolved.value);
        totalSizeBytes += stat.size;
        mtimes.push({ path: note, mtime: stat.mtime.toISOString() });
        const content = await fs.promises.readFile(resolved.value, "utf8");
        for (const match of content.matchAll(tagRegex)) {
          tagSet.add(match[1]);
        }
        for (const match of content.matchAll(wikiLinkRegex)) {
          const target = match[1].includes("|") ? match[1].split("|")[0].trim() : match[1].trim();
          const targetPath = target.endsWith(".md") ? target : `${target}.md`;
          if (!allLinks.has(targetPath)) allLinks.set(targetPath, new Set());
          allLinks.get(targetPath)!.add(note);
          wikiLinkCount++;
        }
      }

      let orphanCount = 0;
      for (const note of noteList) {
        const incoming = allLinks.get(note);
        if (!incoming || incoming.size === 0) orphanCount++;
      }

      const recentlyModified = mtimes
        .sort((a, b) => b.mtime.localeCompare(a.mtime))
        .slice(0, 5);

      const folderNames = new Set<string>();
      for (const n of noteList) {
        const parts = n.split("/");
        if (parts.length > 1) {
          for (let i = 0; i < parts.length - 1; i++) {
            folderNames.add(parts.slice(0, i + 1).join("/"));
          }
        }
      }
      const folderCount = folderNames.size + emptyFolders.filter((f) => !f.startsWith(".void")).length;

      const stats: VaultStats = {
        noteCount: noteList.length,
        folderCount,
        totalSizeBytes,
        tagCount: tagSet.size,
        wikiLinkCount,
        orphanCount,
        recentlyModified,
        averageNoteSize: noteList.length > 0 ? Math.round(totalSizeBytes / noteList.length) : 0,
      };
      return ok(stats);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  }));

  ipcMain.handle("update:check", async () => {
    try {
      const result = await handleCheckForUpdates();
      return ok(result);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  });
  ipcMain.handle("update:download", async () => {
    try {
      handleDownloadUpdate();
      return ok(undefined);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  });
  ipcMain.handle("update:install", async () => {
    try {
      handleInstallUpdate();
      return ok(undefined);
    } catch (e) {
      return err("IO_ERROR", (e as Error).message);
    }
  });
}
