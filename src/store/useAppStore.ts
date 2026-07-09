import { create } from "zustand";
import { ThemeName, PanelTab, Tab } from "../types";

// ─── Helpers ─────────────────────────────────────────────

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(value: Updater<T>, prev: T): T {
  return typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
}

function loadLocal(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function persist(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

function loadBookmarks(): string[] {
  try {
    const stored = localStorage.getItem("void-bookmarks");
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

// ─── Initial values ──────────────────────────────────────

const initialTheme = (loadLocal("void-notes-theme", "obsidian") as ThemeName) || "obsidian";
const initialVimMode = loadLocal("void-vim-mode", "false") === "true";
const initialReadable = loadLocal("void-readable-line", "true") === "true";
const initialEditorFont = loadLocal("void-editor-font", "Cascadia Code, Fira Code, JetBrains Mono, Consolas, monospace");
const initialSpellcheck = loadLocal("void-spellcheck", "true") !== "false";

// ─── Store shape ─────────────────────────────────────────

interface AppState {
  // Vault
  vaultPath: string | null;
  vaultReady: boolean;
  setVaultPath: (p: string | null) => void;
  setVaultReady: (r: boolean) => void;

  // Notes
  notes: string[];
  activeNote: string | null;
  rawContent: string;
  previewMode: boolean;
  saved: boolean;
  setNotes: (v: Updater<string[]>) => void;
  setActiveNote: (v: Updater<string | null>) => void;
  setRawContent: (v: Updater<string>) => void;
  setPreviewMode: (v: Updater<boolean>) => void;
  setSaved: (v: Updater<boolean>) => void;

  // Backlinks & Tags
  allContents: Map<string, string>;
  backlinks: Map<string, string[]>;
  tagIndex: Map<string, string[]>;
  selectedTags: string[];
  setAllContents: (v: Updater<Map<string, string>>) => void;
  setBacklinks: (v: Updater<Map<string, string[]>>) => void;
  setTagIndex: (v: Updater<Map<string, string[]>>) => void;
  setSelectedTags: (v: Updater<string[]>) => void;
  toggleTag: (tag: string) => void;

  // Tabs
  openTabs: Tab[];
  activeTabId: string | null;
  setOpenTabs: (v: Updater<Tab[]>) => void;
  setActiveTabId: (v: Updater<string | null>) => void;

  // UI panels
  showSearch: boolean;
  showSettings: boolean;
  showHelp: boolean;
  showGraph: boolean;
  showGlobalSearch: boolean;
  showTemplates: boolean;
  showBookmarks: boolean;
  showCanvas: boolean;
  showRightPanel: boolean;
  focusMode: boolean;
  activePanelTab: PanelTab;
  setShowSearch: (v: Updater<boolean>) => void;
  setShowSettings: (v: Updater<boolean>) => void;
  setShowHelp: (v: Updater<boolean>) => void;
  setShowGraph: (v: Updater<boolean>) => void;
  setShowGlobalSearch: (v: Updater<boolean>) => void;
  setShowTemplates: (v: Updater<boolean>) => void;
  setShowBookmarks: (v: Updater<boolean>) => void;
  setShowCanvas: (v: Updater<boolean>) => void;
  setShowRightPanel: (v: Updater<boolean>) => void;
  setFocusMode: (v: Updater<boolean>) => void;
  setActivePanelTab: (v: Updater<PanelTab>) => void;

  // Theme
  theme: ThemeName;
  setTheme: (v: Updater<ThemeName>) => void;

  // Editor settings
  vimMode: boolean;
  readableLineLength: boolean;
  editorFont: string;
  spellcheck: boolean;
  setVimMode: (v: Updater<boolean>) => void;
  setReadableLineLength: (v: Updater<boolean>) => void;
  setEditorFont: (v: Updater<string>) => void;
  setSpellcheck: (v: Updater<boolean>) => void;

  // Bookmarks
  bookmarks: string[];
  setBookmarks: (v: Updater<string[]>) => void;
  toggleBookmark: (note: string) => void;

  // Rename
  renamingFile: string | null;
  renameValue: string;
  setRenamingFile: (v: Updater<string | null>) => void;
  setRenameValue: (v: Updater<string>) => void;
}

// ─── Store ───────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // Vault
  vaultPath: null,
  vaultReady: false,
  setVaultPath: (p) => set({ vaultPath: p }),
  setVaultReady: (r) => set({ vaultReady: r }),

  // Notes
  notes: [],
  activeNote: null,
  rawContent: "",
  previewMode: false,
  saved: true,
  setNotes: (v) => set((s) => ({ notes: resolve(v, s.notes) })),
  setActiveNote: (v) => set((s) => ({ activeNote: resolve(v, s.activeNote) })),
  setRawContent: (v) => set((s) => ({ rawContent: resolve(v, s.rawContent) })),
  setPreviewMode: (v) => set((s) => ({ previewMode: resolve(v, s.previewMode) })),
  setSaved: (v) => set((s) => ({ saved: resolve(v, s.saved) })),

  // Backlinks & Tags
  allContents: new Map(),
  backlinks: new Map(),
  tagIndex: new Map(),
  selectedTags: [],
  setAllContents: (v) => set((s) => ({ allContents: resolve(v, s.allContents) })),
  setBacklinks: (v) => set((s) => ({ backlinks: resolve(v, s.backlinks) })),
  setTagIndex: (v) => set((s) => ({ tagIndex: resolve(v, s.tagIndex) })),
  setSelectedTags: (v) => set((s) => ({ selectedTags: resolve(v, s.selectedTags) })),
  toggleTag: (tag) => {
    const prev = get().selectedTags;
    set({ selectedTags: prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag] });
  },

  // Tabs
  openTabs: [],
  activeTabId: null,
  setOpenTabs: (v) => set((s) => ({ openTabs: resolve(v, s.openTabs) })),
  setActiveTabId: (v) => set((s) => ({ activeTabId: resolve(v, s.activeTabId) })),

  // UI panels
  showSearch: false,
  showSettings: false,
  showHelp: false,
  showGraph: false,
  showGlobalSearch: false,
  showTemplates: false,
  showBookmarks: false,
  showCanvas: false,
  showRightPanel: true,
  focusMode: false,
  activePanelTab: "backlinks",
  setShowSearch: (v) => set((s) => ({ showSearch: resolve(v, s.showSearch) })),
  setShowSettings: (v) => set((s) => ({ showSettings: resolve(v, s.showSettings) })),
  setShowHelp: (v) => set((s) => ({ showHelp: resolve(v, s.showHelp) })),
  setShowGraph: (v) => set((s) => ({ showGraph: resolve(v, s.showGraph) })),
  setShowGlobalSearch: (v) => set((s) => ({ showGlobalSearch: resolve(v, s.showGlobalSearch) })),
  setShowTemplates: (v) => set((s) => ({ showTemplates: resolve(v, s.showTemplates) })),
  setShowBookmarks: (v) => set((s) => ({ showBookmarks: resolve(v, s.showBookmarks) })),
  setShowCanvas: (v) => set((s) => ({ showCanvas: resolve(v, s.showCanvas) })),
  setShowRightPanel: (v) => set((s) => ({ showRightPanel: resolve(v, s.showRightPanel) })),
  setFocusMode: (v) => set((s) => ({ focusMode: resolve(v, s.focusMode) })),
  setActivePanelTab: (v) => set((s) => ({ activePanelTab: resolve(v, s.activePanelTab) })),

  // Theme
  theme: initialTheme,
  setTheme: (v) => set((s) => {
    const next = resolve(v, s.theme);
    persist("void-notes-theme", next);
    return { theme: next };
  }),

  // Editor settings
  vimMode: initialVimMode,
  readableLineLength: initialReadable,
  editorFont: initialEditorFont,
  spellcheck: initialSpellcheck,
  setVimMode: (v) => set((s) => {
    const next = resolve(v, s.vimMode);
    persist("void-vim-mode", String(next));
    return { vimMode: next };
  }),
  setReadableLineLength: (v) => set((s) => {
    const next = resolve(v, s.readableLineLength);
    persist("void-readable-line", String(next));
    return { readableLineLength: next };
  }),
  setEditorFont: (v) => set((s) => {
    const next = resolve(v, s.editorFont);
    persist("void-editor-font", next);
    return { editorFont: next };
  }),
  setSpellcheck: (v) => set((s) => {
    const next = resolve(v, s.spellcheck);
    persist("void-spellcheck", String(next));
    return { spellcheck: next };
  }),

  // Bookmarks
  bookmarks: loadBookmarks(),
  setBookmarks: (v) => set((s) => {
    const next = resolve(v, s.bookmarks);
    persist("void-bookmarks", JSON.stringify(next));
    return { bookmarks: next };
  }),
  toggleBookmark: (note) => {
    const prev = get().bookmarks;
    const next = prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note];
    persist("void-bookmarks", JSON.stringify(next));
    set({ bookmarks: next });
  },

  // Rename
  renamingFile: null,
  renameValue: "",
  setRenamingFile: (v) => set((s) => ({ renamingFile: resolve(v, s.renamingFile) })),
  setRenameValue: (v) => set((s) => ({ renameValue: resolve(v, s.renameValue) })),
}));

// ─── Selectors ───────────────────────────────────────────

export const useFilteredNotes = () => {
  const notes = useAppStore((s) => s.notes);
  const selectedTags = useAppStore((s) => s.selectedTags);
  const tagIndex = useAppStore((s) => s.tagIndex);
  if (selectedTags.length === 0) return notes;
  return notes.filter((file) =>
    selectedTags.every((tag) => {
      const files = tagIndex.get(tag);
      return files && files.includes(file);
    })
  );
};

export const useSortedTags = () => {
  const backlinks = useAppStore((s) => s.backlinks);
  return Array.from(useAppStore((s) => s.tagIndex).keys()).sort();
};

export const useNoteBacklinks = () => {
  const activeNote = useAppStore((s) => s.activeNote);
  const backlinks = useAppStore((s) => s.backlinks);
  return activeNote ? (backlinks.get(activeNote) || []) : [];
};
