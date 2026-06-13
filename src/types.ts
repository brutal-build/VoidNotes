declare global {
  interface Window {
    electronAPI: {
      selectVault: () => Promise<string | null>;
      setVault: (p: string) => Promise<boolean>;
      getVault: () => Promise<string | null>;
      listNotes: () => Promise<string[]>;
      loadNote: (fileName: string) => Promise<string>;
      saveNote: (fileName: string, content: string) => Promise<boolean>;
      createNote: (folder?: string) => Promise<string | null>;
      deleteNote: (fileName: string) => Promise<boolean>;
      statNote: (fileName: string) => Promise<{ mtime: string; size: number } | null>;
    };
  }
}

export {};
