import { Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { ReactNode } from "react";
import {
  VoidPlugin, VoidAPI, CommandEntry, SidebarPanel,
  ToolbarButton, StatusBarItem, EventBus, EditorAPI, NoteAPI, VaultAPI,
} from "./pluginInterface";

class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((h) => {
      try { h(...args); } catch (e) { console.error(`Event "${event}" handler error:`, e); }
    });
  }

  once(event: string, handler: (...args: any[]) => void): void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      handler(...args);
    };
    this.on(event, wrapper);
  }
}

class CommandRegistryImpl {
  private commands = new Map<string, CommandEntry>();

  register(command: CommandEntry): void {
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  execute(id: string, api: VoidAPI): void {
    const cmd = this.commands.get(id);
    if (cmd) {
      try { cmd.action(api); } catch (e) { console.error(`Command "${id}" error:`, e); }
    }
  }

  getAll(): CommandEntry[] {
    return Array.from(this.commands.values());
  }
}

class EditorAPIImpl implements EditorAPI {
  private view: EditorView | null = null;
  private extensions: Extension[] = [];

  setView(view: EditorView | null): void {
    this.view = view;
  }

  getView(): EditorView | null {
    return this.view;
  }

  insertText(text: string): void {
    if (!this.view) return;
    const { from } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length },
    });
  }

  getValue(): string {
    return this.view?.state.doc.toString() ?? "";
  }

  setValue(value: string): void {
    if (!this.view) return;
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: value },
    });
  }

  getSelection(): string {
    if (!this.view) return "";
    const { from, to } = this.view.state.selection.main;
    return this.view.state.sliceDoc(from, to);
  }

  replaceSelection(text: string): void {
    if (!this.view) return;
    const { from, to } = this.view.state.selection.main;
    this.view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
  }

  registerExtension(ext: Extension): void {
    this.extensions.push(ext);
  }

  registerKeymap(key: string, run: (view: EditorView) => boolean): void {
    this.extensions.push(keymap.of([{ key, run }]));
  }

  getExtensions(): Extension[] {
    return this.extensions;
  }
}

class UIRegistryImpl {
  private sidebarPanels = new Map<string, SidebarPanel>();
  private toolbarButtons = new Map<string, ToolbarButton>();
  private statusBarItems = new Map<string, StatusBarItem>();

  registerSidebarPanel(panel: SidebarPanel): void { this.sidebarPanels.set(panel.id, panel); }
  unregisterSidebarPanel(id: string): void { this.sidebarPanels.delete(id); }
  getSidebarPanels(): SidebarPanel[] {
    return Array.from(this.sidebarPanels.values()).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }

  registerToolbarButton(btn: ToolbarButton): void { this.toolbarButtons.set(btn.id, btn); }
  unregisterToolbarButton(id: string): void { this.toolbarButtons.delete(id); }
  getToolbarButtons(): ToolbarButton[] {
    return Array.from(this.toolbarButtons.values()).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }

  registerStatusBarItem(item: StatusBarItem): void { this.statusBarItems.set(item.id, item); }
  unregisterStatusBarItem(id: string): void { this.statusBarItems.delete(id); }
  getStatusBarItems(): StatusBarItem[] {
    return Array.from(this.statusBarItems.values()).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }
}

export class PluginSystem {
  private plugins = new Map<string, VoidPlugin>();
  private editorAPI = new EditorAPIImpl();
  private uiRegistry = new UIRegistryImpl();
  private commandRegistry = new CommandRegistryImpl();
  private eventBus = new EventBusImpl();
  private noteAPI!: NoteAPI;
  private vaultAPI!: VaultAPI;
  private theme = "obsidian";
  private api!: VoidAPI;

  constructor() {
    this.api = this.buildAPI();
  }

  private buildAPI(): VoidAPI {
    return {
      editor: this.editorAPI,
      note: {
        getActive: () => this.noteAPI?.getActive() ?? null,
        getContent: () => this.noteAPI?.getContent() ?? "",
        setContent: (c: string) => this.noteAPI?.setContent(c),
        getAllNotes: () => this.noteAPI?.getAllNotes() ?? [],
        load: (f: string) => this.noteAPI?.load(f) ?? Promise.resolve(""),
        save: (f: string, c: string) => this.noteAPI?.save(f, c) ?? Promise.resolve(false),
        create: (n?: string) => this.noteAPI?.create(n) ?? Promise.resolve(null),
        delete: (f: string) => this.noteAPI?.delete(f) ?? Promise.resolve(false),
        rename: (o: string, n: string) => this.noteAPI?.rename(o, n) ?? Promise.resolve(false),
      },
      vault: {
        getPath: () => this.vaultAPI?.getPath() ?? null,
        select: () => this.vaultAPI?.select() ?? Promise.resolve(null),
      },
      commands: {
        register: (cmd) => this.commandRegistry.register(cmd),
        unregister: (id) => this.commandRegistry.unregister(id),
        execute: (id) => this.commandRegistry.execute(id, this.api),
        getAll: () => this.commandRegistry.getAll(),
      },
      ui: {
        registerSidebarPanel: (p) => this.uiRegistry.registerSidebarPanel(p),
        unregisterSidebarPanel: (id) => this.uiRegistry.unregisterSidebarPanel(id),
        registerToolbarButton: (b) => this.uiRegistry.registerToolbarButton(b),
        unregisterToolbarButton: (id) => this.uiRegistry.unregisterToolbarButton(id),
        registerStatusBarItem: (i) => this.uiRegistry.registerStatusBarItem(i),
        unregisterStatusBarItem: (id) => this.uiRegistry.unregisterStatusBarItem(id),
        getSidebarPanels: () => this.uiRegistry.getSidebarPanels(),
        getToolbarButtons: () => this.uiRegistry.getToolbarButtons(),
        getStatusBarItems: () => this.uiRegistry.getStatusBarItems(),
      },
      events: this.eventBus,
      app: {
        getTheme: () => this.theme,
        getVersion: () => "0.2.5",
      },
    };
  }

  getAPI(): VoidAPI { return this.api; }
  getEditorAPI(): EditorAPIImpl { return this.editorAPI; }
  getUIRegistry(): UIRegistryImpl { return this.uiRegistry; }
  getCommandRegistry(): CommandRegistryImpl { return this.commandRegistry; }
  getEventBus(): EventBus { return this.eventBus; }

  setNoteAPI(noteAPI: NoteAPI): void { this.noteAPI = noteAPI; }
  setVaultAPI(vaultAPI: VaultAPI): void { this.vaultAPI = vaultAPI; }
  setEditorView(view: EditorView | null): void { this.editorAPI.setView(view); }
  setTheme(theme: string): void { this.theme = theme; }

  async registerPlugin(plugin: VoidPlugin): Promise<void> {
    const { id } = plugin.manifest;
    if (this.plugins.has(id)) {
      console.warn(`Plugin "${id}" already registered.`);
      return;
    }
    this.plugins.set(id, plugin);
    if (plugin.onInit) {
      try { await plugin.onInit(this.api); } catch (e) { console.error(`Plugin "${id}" onInit error:`, e); }
    }
  }

  unregisterPlugin(id: string): void {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    if (plugin.onUnload) {
      try { plugin.onUnload(this.api); } catch (e) { console.error(`Plugin "${id}" onUnload error:`, e); }
    }
    this.plugins.delete(id);
  }

  getPlugin(id: string): VoidPlugin | undefined { return this.plugins.get(id); }
  getAllPlugins(): VoidPlugin[] { return Array.from(this.plugins.values()); }

  async callNoteLoad(fileName: string): Promise<void> {
    for (const p of this.plugins.values()) {
      if (p.onNoteLoad) {
        try { p.onNoteLoad(this.api, fileName); } catch (e) { console.error(`Plugin "${p.manifest.id}" onNoteLoad error:`, e); }
      }
    }
    this.eventBus.emit("note-loaded", fileName);
  }

  callNoteSave(fileName: string, content: string): string {
    let modified = content;
    for (const p of this.plugins.values()) {
      if (p.onNoteSave) {
        try {
          const result = p.onNoteSave(this.api, fileName, modified);
          if (typeof result === "string") modified = result;
        } catch (e) { console.error(`Plugin "${p.manifest.id}" onNoteSave error:`, e); }
      }
    }
    this.eventBus.emit("note-saved", fileName, modified);
    return modified;
  }

  async callAppReady(): Promise<void> {
    for (const p of this.plugins.values()) {
      if (p.onAppReady) {
        try { await p.onAppReady(this.api); } catch (e) { console.error(`Plugin "${p.manifest.id}" onAppReady error:`, e); }
      }
    }
    this.eventBus.emit("app-ready");
  }

  getAllEditorExtensions(): Extension[] {
    return this.editorAPI.getExtensions();
  }
}

export const pluginSystem = new PluginSystem();
