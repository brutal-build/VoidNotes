import { SimulationNodeDatum } from "d3-force";
import type { IpcResult, NoteStat, TrashEntry } from "./shared/ipc-contract";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  setBackground: (color: string) => Promise<void>;
  selectVault: () => Promise<IpcResult<string>>;
  setVault: (p: string) => Promise<IpcResult<string>>;
  getVault: () => Promise<IpcResult<string | null>>;
  listNotes: () => Promise<IpcResult<{ notes: string[]; emptyFolders: string[] }>>;
  loadNote: (fileName: string) => Promise<IpcResult<string>>;
  saveNote: (fileName: string, content: string) => Promise<IpcResult<void>>;
  createNote: (path?: string) => Promise<IpcResult<string>>;
  deleteNote: (fileName: string) => Promise<IpcResult<{ trashId: string }>>;
  renameNote: (oldName: string, newName: string) => Promise<IpcResult<string>>;
  statNote: (fileName: string) => Promise<IpcResult<NoteStat>>;
  listPlugins: () => Promise<string[]>;
  loadPlugin: (name: string) => Promise<string>;
  savePluginFile: (name: string, content: string) => Promise<boolean>;
  deletePluginFile: (name: string) => Promise<boolean>;
  createFolder: (folderName: string) => Promise<IpcResult<string>>;
  renameFolder: (folderName: string, newName: string) => Promise<IpcResult<string>>;
  deleteFolder: (folderName: string) => Promise<IpcResult<void>>;
  listTrash: () => Promise<IpcResult<TrashEntry[]>>;
  loadTrash: (id: string) => Promise<IpcResult<string>>;
  restoreTrash: (id: string) => Promise<IpcResult<string>>;
  deleteTrash: (id: string) => Promise<IpcResult<void>>;
  closeReady: () => Promise<IpcResult<void>>;
  onCloseRequested: (callback: () => void) => () => void;
}

// ─── Theme ───────────────────────────────────────────────

export type ThemeName = "obsidian" | "light" | "dracula" | "nord" | "solarized" | "macos";

// ─── Note ────────────────────────────────────────────────

export interface NoteFrontmatter {
  title?: string;
  tags?: string[];
  date?: string;
  [key: string]: unknown;
}

export interface ParsedNote {
  data: NoteFrontmatter;
  content: string;
}

export interface Tab {
  id: string;
  label: string;
  dirty: boolean;
}

// ─── Editor ──────────────────────────────────────────────

export interface EditorState {
  cursor: { line: number; ch: number };
  scrollTop: number;
  selection?: { anchor: { line: number; ch: number }; head: { line: number; ch: number } };
}

// ─── Graph ───────────────────────────────────────────────

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  path: string;
  size: number;
  color: string;
  folder: string;
  tags: string[];
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type ColorMode = "default" | "folder" | "degree";
export type SizeMode = "degree" | "fixed";

export interface GraphFilter {
  searchQuery: string;
  hideOrphans: boolean;
  folderPath: string;
  minConnections: number;
  showTags: string[];
  colorMode: ColorMode;
  sizeMode: SizeMode;
}

export interface GraphLayoutOptions {
  width: number;
  height: number;
  chargeStrength?: number;
  linkDistance?: number;
  collideRadius?: number;
}

// ─── UI Panels ───────────────────────────────────────────

export type ActivePanel = "graph" | "templates" | "bookmarks" | "canvas" | null;
export type PanelTab = "backlinks" | "outgoing" | "tags" | "outline" | "properties";

// ─── Plugin ──────────────────────────────────────────────

export interface Plugin {
  name: string;
  init: () => void;
  destroy: () => void;
}

export {}; 
