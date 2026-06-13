import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { ReactNode } from "react";

export interface CommandEntry {
  id: string;
  title: string;
  icon?: string;
  category?: string;
  action: (api: VoidAPI) => void | Promise<void>;
}

export interface SidebarPanel {
  id: string;
  title: string;
  icon?: string;
  render: (api: VoidAPI) => ReactNode;
  order?: number;
}

export interface ToolbarButton {
  id: string;
  title: string;
  icon: string;
  onClick: (api: VoidAPI) => void;
  isActive?: (api: VoidAPI) => boolean;
  order?: number;
}

export interface StatusBarItem {
  id: string;
  render: (api: VoidAPI) => ReactNode;
  order?: number;
  align?: "left" | "right";
}

export interface EditorAPI {
  getView: () => EditorView | null;
  insertText: (text: string) => void;
  getValue: () => string;
  setValue: (value: string) => void;
  getSelection: () => string;
  replaceSelection: (text: string) => void;
  registerExtension: (ext: Extension) => void;
  registerKeymap: (key: string, run: (view: EditorView) => boolean) => void;
}

export interface NoteAPI {
  getActive: () => string | null;
  getContent: () => string;
  setContent: (content: string) => void;
  getAllNotes: () => string[];
  load: (fileName: string) => Promise<string>;
  save: (fileName: string, content: string) => Promise<boolean>;
  create: (name?: string) => Promise<string | null>;
  delete: (fileName: string) => Promise<boolean>;
  rename: (oldName: string, newName: string) => Promise<string | false>;
}

export interface VaultAPI {
  getPath: () => string | null;
  select: () => Promise<string | null>;
}

export interface EventBus {
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  once(event: string, handler: (...args: any[]) => void): void;
}

export interface VoidAPI {
  editor: EditorAPI;
  note: NoteAPI;
  vault: VaultAPI;
  commands: {
    register: (command: CommandEntry) => void;
    unregister: (id: string) => void;
    execute: (id: string) => void;
    getAll: () => CommandEntry[];
  };
  ui: {
    registerSidebarPanel: (panel: SidebarPanel) => void;
    unregisterSidebarPanel: (id: string) => void;
    registerToolbarButton: (button: ToolbarButton) => void;
    unregisterToolbarButton: (id: string) => void;
    registerStatusBarItem: (item: StatusBarItem) => void;
    unregisterStatusBarItem: (id: string) => void;
    getSidebarPanels: () => SidebarPanel[];
    getToolbarButtons: () => ToolbarButton[];
    getStatusBarItems: () => StatusBarItem[];
  };
  events: EventBus;
  app: {
    getTheme: () => string;
    getVersion: () => string;
  };
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main: string;
}

export interface VoidPlugin {
  manifest: PluginManifest;
  onInit?: (api: VoidAPI) => void | Promise<void>;
  onNoteLoad?: (api: VoidAPI, fileName: string) => void;
  onNoteSave?: (api: VoidAPI, fileName: string, content: string) => string | void;
  onAppReady?: (api: VoidAPI) => void;
  onUnload?: (api: VoidAPI) => void;
}
