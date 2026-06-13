declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      setBackground: (color: string) => Promise<void>;
      selectVault: () => Promise<string | null>;
      setVault: (p: string) => Promise<boolean>;
      getVault: () => Promise<string | null>;
      listNotes: () => Promise<string[]>;
      loadNote: (fileName: string) => Promise<string>;
      saveNote: (fileName: string, content: string) => Promise<boolean>;
      createNote: (folder?: string) => Promise<string | null>;
      deleteNote: (fileName: string) => Promise<boolean>;
      renameNote: (oldName: string, newName: string) => Promise<string | false>;
      statNote: (fileName: string) => Promise<{ mtime: string; birthtime: string; size: number } | null>;
      listPlugins: () => Promise<string[]>;
      loadPlugin: (name: string) => Promise<string>;
      savePluginFile: (name: string, content: string) => Promise<boolean>;
      deletePluginFile: (name: string) => Promise<boolean>;
    };
  }
}

export {};
