import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Vault
  selectVault: (): Promise<string | null> => ipcRenderer.invoke("vault:select"),
  setVault: (p: string): Promise<boolean> => ipcRenderer.invoke("vault:set", p),
  getVault: (): Promise<string | null> => ipcRenderer.invoke("vault:get"),

  // Notes
  listNotes: (): Promise<string[]> => ipcRenderer.invoke("notes:list"),
  loadNote: (fileName: string): Promise<string> => ipcRenderer.invoke("notes:load", fileName),
  saveNote: (fileName: string, content: string): Promise<boolean> => ipcRenderer.invoke("notes:save", fileName, content),
  createNote: (folder?: string): Promise<string | null> => ipcRenderer.invoke("notes:create", folder),
  deleteNote: (fileName: string): Promise<boolean> => ipcRenderer.invoke("notes:delete", fileName),
  statNote: (fileName: string): Promise<{ mtime: string; size: number } | null> => ipcRenderer.invoke("notes:stat", fileName),
});
