import { contextBridge, ipcRenderer } from "electron";
const IPC_CHANNELS = { vaultSelect: "vault:select", vaultSet: "vault:set", vaultGet: "vault:get", notesList: "notes:list", notesLoad: "notes:load", notesSave: "notes:save", notesCreate: "notes:create", notesDelete: "notes:delete", notesRename: "notes:rename", notesStat: "notes:stat", trashList: "trash:list", trashLoad: "trash:load", trashRestore: "trash:restore", trashDelete: "trash:delete", folderCreate: "folder:create", folderRename: "folder:rename", folderDelete: "folder:delete", appCloseReady: "app:close-ready" } as const;

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
});
