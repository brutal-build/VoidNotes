import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../src/shared/ipc-contract";

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.invoke("window:minimize"), maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"), setBackground: (color: string) => ipcRenderer.invoke("window:set-background", color),
  selectVault: () => ipcRenderer.invoke(IPC_CHANNELS.vaultSelect), setVault: (p: string) => ipcRenderer.invoke(IPC_CHANNELS.vaultSet, p),
  getVault: () => ipcRenderer.invoke(IPC_CHANNELS.vaultGet), listNotes: () => ipcRenderer.invoke(IPC_CHANNELS.notesList),
  loadNote: (p: string) => ipcRenderer.invoke(IPC_CHANNELS.notesLoad, p), saveNote: (p: string, c: string) => ipcRenderer.invoke(IPC_CHANNELS.notesSave, p, c),
  createNote: (p?: string) => ipcRenderer.invoke(IPC_CHANNELS.notesCreate, p), deleteNote: (p: string) => ipcRenderer.invoke(IPC_CHANNELS.notesDelete, p),
  renameNote: (p: string, n: string) => ipcRenderer.invoke(IPC_CHANNELS.notesRename, p, n), statNote: (p: string) => ipcRenderer.invoke(IPC_CHANNELS.notesStat, p),
  listTrash: () => ipcRenderer.invoke(IPC_CHANNELS.trashList), loadTrash: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.trashLoad, id),
  restoreTrash: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.trashRestore, id),
  deleteTrash: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.trashDelete, id), createFolder: (p: string) => ipcRenderer.invoke(IPC_CHANNELS.folderCreate, p),
  renameFolder: (p: string, n: string) => ipcRenderer.invoke(IPC_CHANNELS.folderRename, p, n), deleteFolder: (p: string) => ipcRenderer.invoke(IPC_CHANNELS.folderDelete, p),
  closeReady: () => ipcRenderer.invoke(IPC_CHANNELS.appCloseReady),
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  onUpdateAvailable: (callback: (info: { version: string; releaseDate: string; releaseNotes: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: { version: string; releaseDate: string; releaseNotes: string }) => callback(info);
    ipcRenderer.on("update:available", listener);
    return () => ipcRenderer.removeListener("update:available", listener);
  },
  onDownloadProgress: (callback: (percent: number) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, percent: number) => callback(percent);
    ipcRenderer.on("update:progress", listener);
    return () => ipcRenderer.removeListener("update:progress", listener);
  },
  onUpdateDownloaded: (callback: (info: { version: string; releaseDate: string; releaseNotes: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, info: { version: string; releaseDate: string; releaseNotes: string }) => callback(info);
    ipcRenderer.on("update:downloaded", listener);
    return () => ipcRenderer.removeListener("update:downloaded", listener);
  },
  onUpdateError: (callback: (message: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on("update:error", listener);
    return () => ipcRenderer.removeListener("update:error", listener);
  },
  onUpdateNotAvailable: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("update:not-available", listener);
    return () => ipcRenderer.removeListener("update:not-available", listener);
  },
  onCloseRequested: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("app:close-requested", listener);
    return () => ipcRenderer.removeListener("app:close-requested", listener);
  },
  onExternalChange: (callback: (change: { type: string; path: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, change: { type: string; path: string }) => callback(change);
    ipcRenderer.on("notes:external-change", listener);
    return () => ipcRenderer.removeListener("notes:external-change", listener);
  },
  writeFile: (relativePath: string, data: number[]) => ipcRenderer.invoke(IPC_CHANNELS.filesWrite, relativePath, data),
  readFile: (relativePath: string) => ipcRenderer.invoke(IPC_CHANNELS.filesRead, relativePath),
  logError: (payload: { message: string; stack?: string; timestamp: string }) => ipcRenderer.invoke(IPC_CHANNELS.logError, payload),
  dailyNotePath: () => ipcRenderer.invoke(IPC_CHANNELS.dailyNotePath),
  exportNote: (notePath: string) => ipcRenderer.invoke(IPC_CHANNELS.exportNote, notePath),
  exportVaultZip: () => ipcRenderer.invoke(IPC_CHANNELS.exportVaultZip),
  exportNoteHtml: (notePath: string) => ipcRenderer.invoke(IPC_CHANNELS.exportNoteHtml, notePath),
  getVaultStats: () => ipcRenderer.invoke(IPC_CHANNELS.vaultStats),
});
