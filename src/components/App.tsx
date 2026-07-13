import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import Sidebar from "./Sidebar";
import NoteParser from "./NoteParser";
import CommandPalette from "./CommandPalette";
import VaultSetup from "./VaultSetup";
import StatusBar from "./StatusBar";
import TrafficLights from "./TrafficLights";
import ResizablePanel from "./ResizablePanel";
import LeftRibbon from "./LeftRibbon";
import TabBar from "./TabBar";
import RightPanel from "./RightPanel";
import ErrorBoundary from "./ErrorBoundary";
import { InputDialog } from "./ui/InputDialog";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { parseFrontmatter, buildBacklinks, buildTagIndex } from "../plugins/frontmatter";
import { useAppStore, useFilteredNotes, useSortedTags, useNoteBacklinks } from "../store/useAppStore";
import { createNoteSessionCoordinator, nearestNeighborAfterClose } from "../services/note-session";
import { VaultIndex } from "../services/vault-index";
import type { ThemeName, Tab, ActivePanel } from "../types";

// Lazy-loaded — these are opened modally and don't need to load upfront
const Settings = React.lazy(() => import("./Settings"));
const Help = React.lazy(() => import("./Help"));
const GraphView = React.lazy(() => import("./GraphView"));
const GlobalSearch = React.lazy(() => import("./GlobalSearch"));
const TemplatesPanel = React.lazy(() => import("./TemplatesPanel"));
const BookmarksPanel = React.lazy(() => import("./BookmarksPanel"));
const NoteEditor = React.lazy(() => import("./NoteEditor"));
const CanvasView = React.lazy(() => import("./CanvasView"));
const TrashPanel = React.lazy(() => import("./TrashPanel"));

function LazyFallback() {
  return <div className="lazy-loading">Loading...</div>;
}

const THEME_BG: Record<ThemeName, string> = {
  obsidian: "#1e1e1e",
  light: "#ffffff",
  dracula: "#282a36",
  nord: "#2e3440",
  solarized: "#002b36",
  macos: "#1a1a1a",
};

export default function App() {
  // ─── Store ──────────────────────────────────────────────
  const vaultReady = useAppStore((s) => s.vaultReady);
  const notes = useAppStore((s) => s.notes);
  const activeNote = useAppStore((s) => s.activeNote);
  const rawContent = useAppStore((s) => s.rawContent);
  const previewMode = useAppStore((s) => s.previewMode);
  const openTabs = useAppStore((s) => s.openTabs);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const showRightPanel = useAppStore((s) => s.showRightPanel);
  const activePanelTab = useAppStore((s) => s.activePanelTab);
  const showSearch = useAppStore((s) => s.showSearch);
  const showSettings = useAppStore((s) => s.showSettings);
  const showHelp = useAppStore((s) => s.showHelp);
  const showGraph = useAppStore((s) => s.showGraph);
  const showGlobalSearch = useAppStore((s) => s.showGlobalSearch);
  const showTemplates = useAppStore((s) => s.showTemplates);
  const showBookmarks = useAppStore((s) => s.showBookmarks);
  const showCanvas = useAppStore((s) => s.showCanvas);
  const focusMode = useAppStore((s) => s.focusMode);
  const saved = useAppStore((s) => s.saved);
  const vaultPath = useAppStore((s) => s.vaultPath);
  const theme = useAppStore((s) => s.theme);
  const vimMode = useAppStore((s) => s.vimMode);
  const readableLineLength = useAppStore((s) => s.readableLineLength);
  const editorFont = useAppStore((s) => s.editorFont);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const selectedTags = useAppStore((s) => s.selectedTags);
  const allContents = useAppStore((s) => s.allContents);
  const backlinksStore = useAppStore((s) => s.backlinks);
  const spellcheckStore = useAppStore((s) => s.spellcheck);
  const renamingFile = useAppStore((s) => s.renamingFile);
  const renameValue = useAppStore((s) => s.renameValue);

  // Derived
  const filteredNotes = useFilteredNotes();
  const sortedTags = useSortedTags();
  const noteBacklinks = useNoteBacklinks();

  // Shared VaultIndex - built once from allContents, passed to GlobalSearch
  const vaultIndex = useMemo(() => {
    const entries = notes.map((path) => ({
      path,
      content: allContents.get(path) ?? "",
    }));
    return new VaultIndex(entries);
  }, [notes, allContents]);

  // ─── Local UI state ────────────────────────────────────
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [showWikiCreateDialog, setShowWikiCreateDialog] = useState(false);
  const [wikiTarget, setWikiTarget] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  // ─── Note session coordinator ───────────────────────────
  const sessionCoordinator = useMemo(() => createNoteSessionCoordinator({
    load: async (id: string) => {
      const result = await window.electronAPI.loadNote(id);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
    save: async (id: string, content: string) => {
      const result = await window.electronAPI.saveNote(id, content);
      if (!result.ok) throw new Error(result.error.message);
    },
  }), []);

  // ─── Refy (for callbacks that can't use stale closures) ──
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Split state (local - no store re-render during drag) ──
  const [splitView, setSplitView] = useState(() => {
    try { return localStorage.getItem("void-split-view") === "true"; } catch { return false; }
  });
  const [splitRatio, setSplitRatio] = useState(() => {
    try { return parseFloat(localStorage.getItem("void-split-ratio") || "0.5") || 0.5; } catch { return 0.5; }
  });
  const splitRatioRef = useRef(splitRatio);
  const [splitDown, setSplitDown] = useState(false);

  // ─── Actions ────────────────────────────────────────────
  const setVaultPath = useAppStore((s) => s.setVaultPath);
  const setVaultReady = useAppStore((s) => s.setVaultReady);
  const setNotes = useAppStore((s) => s.setNotes);
  const setActiveNote = useAppStore((s) => s.setActiveNote);
  const setRawContent = useAppStore((s) => s.setRawContent);
  const setPreviewMode = useAppStore((s) => s.setPreviewMode);
  const setSaved = useAppStore((s) => s.setSaved);
  const setAllContents = useAppStore((s) => s.setAllContents);
  const setBacklinks = useAppStore((s) => s.setBacklinks);
  const setTagIndex = useAppStore((s) => s.setTagIndex);
  const setOpenTabs = useAppStore((s) => s.setOpenTabs);
  const setActiveTabId = useAppStore((s) => s.setActiveTabId);
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const setShowSettings = useAppStore((s) => s.setShowSettings);
  const setShowHelp = useAppStore((s) => s.setShowHelp);
  const setShowGraph = useAppStore((s) => s.setShowGraph);
  const setShowGlobalSearch = useAppStore((s) => s.setShowGlobalSearch);
  const setShowTemplates = useAppStore((s) => s.setShowTemplates);
  const setShowBookmarks = useAppStore((s) => s.setShowBookmarks);
  const setShowCanvas = useAppStore((s) => s.setShowCanvas);
  const setShowRightPanel = useAppStore((s) => s.setShowRightPanel);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const setActivePanelTab = useAppStore((s) => s.setActivePanelTab);
  const setTheme = useAppStore((s) => s.setTheme);
  const setVimMode = useAppStore((s) => s.setVimMode);
  const setReadableLineLength = useAppStore((s) => s.setReadableLineLength);
  const setEditorFont = useAppStore((s) => s.setEditorFont);
  const setSpellcheck = useAppStore((s) => s.setSpellcheck);
  const setBookmarks = useAppStore((s) => s.setBookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const toggleTag = useAppStore((s) => s.toggleTag);
  const setRenamingFile = useAppStore((s) => s.setRenamingFile);
  const setRenameValue = useAppStore((s) => s.setRenameValue);

  const handleVaultSelect = useCallback(async (p: string) => {
    const result = await window.electronAPI.setVault(p);
    if (!result.ok) {
      setErrorMessage(`Failed to set vault: ${result.error.message}`);
      return;
    }
    setVaultPath(p);
    setVaultReady(true);
  }, [setVaultPath, setVaultReady]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.electronAPI.setBackground(THEME_BG[theme]);
  }, [theme]);

  useEffect(() => {
    window.electronAPI.getVault().then((result) => {
      if (result.ok && result.value) {
        setVaultPath(result.value);
        setVaultReady(true);
      }
    });
  }, [setVaultPath, setVaultReady]);

  const refreshNotes = useCallback(async () => {
    const result = await window.electronAPI.listNotes();
    if (!result.ok) {
      setErrorMessage(`Failed to list notes: ${result.error.message}`);
      return [];
    }
    setNotes(result.value.notes);
    return result.value.notes;
  }, [setNotes]);

  const refreshBacklinks = useCallback(async (files: string[]) => {
    const entries = await Promise.all(files.map(async (file) => {
      const result = await window.electronAPI.loadNote(file);
      return [file, result.ok ? result.value : ""] as const;
    }));
    const contents = new Map<string, string>(entries);
    setAllContents(contents);
    setBacklinks(buildBacklinks(contents));
    setTagIndex(buildTagIndex(contents));
  }, [setAllContents, setBacklinks, setTagIndex]);

  const openNote = useCallback(async (fileName: string) => {
    setActiveNote(fileName);
    setActiveTabId(fileName);
    const result = await window.electronAPI.loadNote(fileName);
    if (!result.ok) {
      setErrorMessage(`Failed to load note: ${result.error.message}`);
      return;
    }
    setRawContent(result.value);
    // Don't reset previewMode - let it persist across notes
    setSaved(true);
    setOpenTabs((prev: Tab[]) => {
      if (prev.some((t) => t.id === fileName)) return prev;
      const label = fileName.split("/").pop()?.replace(/\.md$/, "") || fileName;
      return [...prev, { id: fileName, label, dirty: false }];
    });
  }, [setActiveNote, setActiveTabId, setRawContent, setSaved, setOpenTabs]);

  const handleNewNote = useCallback(() => {
    setShowNewNoteDialog(true);
  }, []);

  const confirmNewNote = useCallback(async (name: string) => {
    setShowNewNoteDialog(false);
    const raw = name.trim();
    const fileName = raw.endsWith(".md") ? raw : `${raw}.md`;
    const result = await window.electronAPI.createNote(fileName);
    if (!result.ok) {
      setErrorMessage(`Failed to create note: ${result.error.message}`);
      return;
    }
    const actualName = result.value;
    const files = await refreshNotes();
    await refreshBacklinks(files);
    await openNote(actualName);
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleNewFolder = useCallback(() => {
    setShowNewFolderDialog(true);
  }, []);

  const confirmNewFolder = useCallback(async (folderName: string) => {
    setShowNewFolderDialog(false);
    const result = await window.electronAPI.createFolder(folderName);
    if (!result.ok) {
      setErrorMessage(`Failed to create folder: ${result.error.message}`);
      return;
    }
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [refreshNotes, refreshBacklinks]);

  const handleDailyNote = useCallback(async () => {
    const today = new Date();
    const fileName = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.md`;
    const files = await refreshNotes();
    if (files.includes(fileName)) {
      await openNote(fileName);
      return;
    }
    const result = await window.electronAPI.createNote(fileName);
    if (!result.ok) {
      setErrorMessage(`Failed to create daily note: ${result.error.message}`);
      return;
    }
    const newFiles = await refreshNotes();
    await refreshBacklinks(newFiles);
    await openNote(fileName);
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleDeleteNote = useCallback((fileName: string) => {
    setDeletingFile(fileName);
    setShowDeleteConfirmDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingFile) return;
    const fileName = deletingFile;
    setShowDeleteConfirmDialog(false);
    setDeletingFile(null);
    const result = await window.electronAPI.deleteNote(fileName);
    if (!result.ok) {
      setErrorMessage(`Failed to delete note: ${result.error.message}`);
      return;
    }
    if (activeNote === fileName) {
      setActiveNote(null);
      setRawContent("");
    }
    setOpenTabs((prev: Tab[]) => prev.filter((t) => t.id !== fileName));
    if (activeTabId === fileName) setActiveTabId(null);
    // Remove from bookmarks
    setBookmarks((prev: string[]) => prev.filter((b) => b !== fileName));
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [deletingFile, activeNote, activeTabId, setActiveNote, setRawContent, setOpenTabs, setActiveTabId, setBookmarks, refreshNotes, refreshBacklinks]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirmDialog(false);
    setDeletingFile(null);
  }, []);

  const handleRenameNote = useCallback((oldName: string) => {
    const baseName = oldName.split("/").pop()?.replace(/\.md$/, "") || oldName;
    setRenamingFile(oldName);
    setRenameValue(baseName);
  }, [setRenamingFile, setRenameValue]);

  const confirmRename = useCallback(async () => {
    if (!renamingFile || !renameValue.trim()) return;
    const result = await window.electronAPI.renameNote(renamingFile, renameValue.trim());
    if (!result.ok) {
      setErrorMessage(`Failed to rename note: ${result.error.message}`);
      return;
    }
    const newPath = result.value;
    if (activeNote === renamingFile) setActiveNote(newPath);
    // Synchronize bookmarks
    setBookmarks((prev: string[]) => prev.map((b) => b === renamingFile ? newPath : b));
    // Synchronize open tabs
    setOpenTabs((prev: Tab[]) => prev.map((t) =>
      t.id === renamingFile ? { ...t, id: newPath, label: newPath.split("/").pop()?.replace(/\.md$/, "") || newPath } : t
    ));
    if (activeTabId === renamingFile) setActiveTabId(newPath);
    setRenamingFile(null);
    setRenameValue("");
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [renamingFile, renameValue, activeNote, activeTabId, setActiveNote, setActiveTabId, setBookmarks, setOpenTabs, setRenamingFile, setRenameValue, refreshNotes, refreshBacklinks]);

  const handleContentChange = useCallback((value: string) => {
    setRawContent(value);
    setSaved(false);
    if (!activeNote) return;
    // Track per-note buffer via session coordinator (no more stale-closure race)
    if (sessionCoordinator.get(activeNote)) {
      sessionCoordinator.update(activeNote, value);
    } else {
      sessionCoordinator.open(activeNote, { buffer: value });
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await sessionCoordinator.save(activeNote);
      } catch (err) {
        setErrorMessage(`Failed to save note: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      setSaved(true);
      const store = useAppStore.getState();
      const contents = new Map(store.allContents);
      contents.set(activeNote, value);
      setAllContents(contents);
      setBacklinks(buildBacklinks(contents));
      setTagIndex(buildTagIndex(contents));
    }, 500);
  }, [activeNote, sessionCoordinator, setRawContent, setSaved, setAllContents, setBacklinks, setTagIndex]);

  const handleManualSave = useCallback(async () => {
    const store = useAppStore.getState();
    const note = store.activeNote;
    const content = store.rawContent;
    if (!note) return;
    // Track buffer and clear pending autosave
    if (sessionCoordinator.get(note)) {
      sessionCoordinator.update(note, content);
    } else {
      sessionCoordinator.open(note, { buffer: content });
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    try {
      await sessionCoordinator.save(note);
    } catch (err) {
      setErrorMessage(`Failed to save note: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    setSaved(true);
    const contents = new Map(store.allContents);
    contents.set(note, content);
    setAllContents(contents);
    setBacklinks(buildBacklinks(contents));
    setTagIndex(buildTagIndex(contents));
  }, [sessionCoordinator, setSaved, setAllContents, setBacklinks, setTagIndex]);

  const handleWikiLinkClick = useCallback(async (target: string) => {
    const fileName = target.endsWith(".md") ? target : `${target}.md`;
    const currentNotes = useAppStore.getState().notes;
    if (currentNotes.includes(fileName)) {
      await openNote(fileName);
    } else {
      setWikiTarget(fileName);
      setShowWikiCreateDialog(true);
    }
  }, [openNote]);

  const confirmWikiCreate = useCallback(async (noteName: string) => {
    setShowWikiCreateDialog(false);
    setWikiTarget(null);
    const result = await window.electronAPI.createNote(noteName);
    if (!result.ok) {
      setErrorMessage(`Failed to create note: ${result.error.message}`);
      return;
    }
    const files = await refreshNotes();
    await refreshBacklinks(files);
    await openNote(noteName);
  }, [refreshNotes, refreshBacklinks, openNote]);

  const cancelWikiCreate = useCallback(() => {
    setShowWikiCreateDialog(false);
    setWikiTarget(null);
  }, []);

  const handleInsertTemplate = useCallback((content: string) => {
    setRawContent(content);
    handleContentChange(content);
  }, [setRawContent, handleContentChange]);

  const togglePreview = useCallback(() => setPreviewMode(!useAppStore.getState().previewMode), [setPreviewMode]);

  const toggleSplitView = useCallback(() => {
    const next = !splitView;
    setSplitView(next);
    try { localStorage.setItem("void-split-view", String(next)); } catch {}
  }, [splitView]);

  // ─── Keep refs for keyboard handler ─────────────────────
  const handleManualSaveRef = useRef(handleManualSave);
  const handleNewNoteRef = useRef(handleNewNote);
  const handleDailyNoteRef = useRef(handleDailyNote);

  useEffect(() => { handleManualSaveRef.current = handleManualSave; }, [handleManualSave]);
  useEffect(() => { handleNewNoteRef.current = handleNewNote; }, [handleNewNote]);
  useEffect(() => { handleDailyNoteRef.current = handleDailyNote; }, [handleDailyNote]);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = document.querySelector(".pane-container");
    if (!container) return;
    const isVertical = container.classList.contains("split-down");
    const rect = container.getBoundingClientRect();
    const startPos = isVertical ? e.clientY : e.clientX;
    const startSize = isVertical ? rect.height : rect.width;
    const startRatio = splitRatioRef.current;

    // Get the editor and preview DOM elements for direct manipulation
    const editorEl = container.querySelector(".pane-editor") as HTMLElement | null;
    const previewEl = container.querySelector(".pane-preview") as HTMLElement | null;

    // Hide preview during drag to avoid expensive re-renders
    const originalPreviewOpacity = previewEl?.style.opacity || "1";
    const originalPreviewPointer = previewEl?.style.pointerEvents || "auto";
    if (previewEl) {
      previewEl.style.opacity = "0.3";
      previewEl.style.pointerEvents = "none";
      previewEl.style.transition = "none";
    }

    const onMove = (ev: MouseEvent) => {
      const delta = (isVertical ? ev.clientY : ev.clientX) - startPos;
      const ratio = Math.min(0.9, Math.max(0.1, startRatio + delta / startSize));
      splitRatioRef.current = ratio;
      // Direct DOM update - no React re-render during drag
      if (editorEl) editorEl.style.flex = `0 0 ${ratio * 100}%`;
      if (previewEl) previewEl.style.flex = `0 0 ${(1 - ratio) * 100}%`;
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      
      // Restore preview visibility
      if (previewEl) {
        previewEl.style.opacity = originalPreviewOpacity;
        previewEl.style.pointerEvents = originalPreviewPointer;
        previewEl.style.transition = "";
      }
      
      // Commit final ratio from ref to local state (single re-render after drag)
      const finalRatio = splitRatioRef.current;
      setSplitRatio(finalRatio);
      try { localStorage.setItem("void-split-ratio", String(finalRatio)); } catch {}
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const handleSwitchVault = useCallback(async () => {
    setShowSettings(false);
    const result = await window.electronAPI.selectVault();
    if (!result.ok) {
      setErrorMessage(`Failed to select vault: ${result.error.message}`);
      return;
    }
    const selectedPath = result.value;
    const setResult = await window.electronAPI.setVault(selectedPath);
    if (!setResult.ok) {
      setErrorMessage(`Failed to set vault: ${setResult.error.message}`);
      return;
    }
    setVaultPath(selectedPath);
    const files = await refreshNotes();
    await refreshBacklinks(files);
    if (files.length > 0) openNote(files[0]);
  }, [setShowSettings, setVaultPath, refreshNotes, refreshBacklinks, openNote]);

  useEffect(() => {
    if (!vaultReady) return;
    refreshNotes().then((files) => {
      refreshBacklinks(files);
      if (files.length > 0) openNote(files[0]);
    });
  }, [vaultReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Close handshake ────────────────────────────────────
  useEffect(() => {
    const cleanup = window.electronAPI.onCloseRequested(async () => {
      // Flush all pending saves before closing
      try {
        await sessionCoordinator.flush();
        await window.electronAPI.closeReady();
      } catch (error) {
        setErrorMessage(`Failed to save changes before closing: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    return cleanup;
  }, [sessionCoordinator]);

  // ─── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const inEditor = active?.closest(".cm-editor") !== null;

      if (e.ctrlKey && e.key === "e") { e.preventDefault(); togglePreview(); }
      if (e.ctrlKey && e.shiftKey && e.key === "E") { e.preventDefault(); toggleSplitView(); }
      if (e.ctrlKey && e.key === "p") { if (!inEditor) { e.preventDefault(); setShowSearch((v: boolean) => !v); } }
      if (e.ctrlKey && e.shiftKey && e.key === "F") { e.preventDefault(); setShowGlobalSearch((v: boolean) => !v); }
      if (e.ctrlKey && e.key === "t") { if (!inEditor) { e.preventDefault(); setShowTemplates((v: boolean) => !v); } }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleManualSaveRef.current(); }
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); handleNewNoteRef.current(); }
      if (e.ctrlKey && e.shiftKey && e.key === "N") { e.preventDefault(); handleDailyNoteRef.current(); }
      if (e.ctrlKey && e.key === ",") { e.preventDefault(); setShowSettings((v: boolean) => !v); }
      if (e.key === "F1") { e.preventDefault(); setShowHelp((v: boolean) => !v); }
      if (e.key === "F9") { e.preventDefault(); setFocusMode((v: boolean) => !v); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePreview, toggleSplitView, setShowSearch, setShowGlobalSearch, setShowTemplates, setShowSettings, setShowHelp, setFocusMode]);

  const handleTabSelect = useCallback((id: string) => { openNote(id); }, [openNote]);
  const closeTab = useCallback((id: string) => {
    const currentTabs = useAppStore.getState().openTabs;
    const remaining = currentTabs.filter((t) => t.id !== id);
    setOpenTabs(remaining);
    if (activeTabId === id) {
      const nextTab = nearestNeighborAfterClose(currentTabs.map((t) => t.id), id);
      if (nextTab) openNote(nextTab);
      else { setActiveNote(null); setRawContent(""); setActiveTabId(null); }
    }
  }, [activeTabId, setOpenTabs, setActiveNote, setRawContent, setActiveTabId, openNote]);

  const handleTabClose = useCallback((id: string) => {
    const session = sessionCoordinator.get(id);
    if (session?.dirty) {
      setClosingTabId(id);
      setShowCloseConfirmDialog(true);
      return;
    }
    closeTab(id);
  }, [sessionCoordinator, closeTab]);

  const handleSaveAndClose = useCallback(async () => {
    if (!closingTabId) return;
    try {
      await sessionCoordinator.save(closingTabId);
      closeTab(closingTabId);
    } catch (err) {
      setErrorMessage(`Failed to save note: ${err instanceof Error ? err.message : String(err)}`);
    }
    setShowCloseConfirmDialog(false);
    setClosingTabId(null);
  }, [closingTabId, sessionCoordinator, closeTab]);

  const handleDiscardAndClose = useCallback(() => {
    if (!closingTabId) return;
    sessionCoordinator.delete(closingTabId);
    closeTab(closingTabId);
    setShowCloseConfirmDialog(false);
    setClosingTabId(null);
  }, [closingTabId, sessionCoordinator, closeTab]);

  const handleCancelClose = useCallback(() => {
    setShowCloseConfirmDialog(false);
    setClosingTabId(null);
  }, []);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setOpenTabs((prev: Tab[]) => { const next = [...prev]; const [moved] = next.splice(fromIndex, 1); next.splice(toIndex, 0, moved); return next; });
  }, [setOpenTabs]);

  // ─── Active panel for ribbon ────────────────────────────
  const activePanel: ActivePanel = showGraph ? "graph" : showTemplates ? "templates" : showBookmarks ? "bookmarks" : showCanvas ? "canvas" : null;

  if (!vaultReady) return <VaultSetup onVaultSelect={handleVaultSelect} />;

  return (
    <div className="app">
      {!focusMode && (
        <LeftRibbon
          onNewNote={handleNewNote}
          onNewFolder={handleNewFolder}
          onOpenGraph={() => setShowGraph(!showGraph)}
          onDailyNote={handleDailyNote}
          onOpenTemplates={() => setShowTemplates(true)}
          onOpenBookmarks={() => setShowBookmarks(true)}
          onOpenCanvas={() => setShowCanvas(true)}
          onOpenTrash={() => setShowTrash(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenSearch={() => setShowSearch(true)}
          activePanel={activePanel}
        />
      )}
      {!focusMode && (
        <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400} storageKey="void-sidebar-width">
          <Sidebar
            notes={filteredNotes}
            allNotes={notes}
            activeNote={activeNote}
            focusMode={focusMode}
            vaultPath={vaultPath}
            tags={sortedTags}
            selectedTags={selectedTags}
            bookmarks={bookmarks}
            onToggleTag={toggleTag}
            onToggleFocusMode={() => setFocusMode((v: boolean) => !v)}
            onSelect={openNote}
            onNew={handleNewNote}
            onDelete={handleDeleteNote}
            onRename={handleRenameNote}
            onToggleBookmark={toggleBookmark}
            onOpenSearch={() => setShowSearch(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHelp={() => setShowHelp(true)}
          />
        </ResizablePanel>
      )}
      <div className="editor-area">
        {!focusMode && openTabs.length > 0 && (
          <TabBar tabs={openTabs} activeTab={activeTabId} onSelect={handleTabSelect} onClose={handleTabClose} onReorder={handleTabReorder} />
        )}
        <div className="top-bar">
          <div className="top-bar-left">
            {focusMode && (
              <button className="btn-icon focus-restore-btn-inline" onClick={() => setFocusMode(false)} title="Show sidebar (F9)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            )}
            <div className="breadcrumb">{activeNote ? <span className="breadcrumb-current">{activeNote.split("/").pop()?.replace(/\.md$/, "") || ""}</span> : <span>No note open</span>}</div>
          </div>
          <div className="top-bar-actions">
            <button className={`btn-mode ${!splitView ? "active" : ""}`} onClick={() => { setPreviewMode((v: boolean) => !v); setSplitView(false); setSplitDown(false); }}>{previewMode ? "Edit" : "Preview"}</button>
            <button className={`btn-mode ${showRightPanel ? "active" : ""}`} onClick={() => setShowRightPanel((v: boolean) => !v)} title="Toggle right panel">Panel</button>
            <div className="top-bar-separator" />
            <TrafficLights />
          </div>
        </div>
        <div className="main-content">
          <div className={`pane-container ${splitView ? "split-view" : ""} ${splitDown ? "split-down" : ""}`}>
            {splitView && activeNote ? (
              <>
                <div className="pane-editor pane-enter" style={{ "--pane-ratio": splitRatio } as React.CSSProperties}>
                  <div className="editor-wrapper"><Suspense fallback={<div className="editor-placeholder" />}><NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} readableLineLength={readableLineLength} editorFont={editorFont} /></Suspense></div>
                </div>
                <div className="split-divider split-divider-h" onMouseDown={handleSplitMouseDown} />
                <NoteParser content={rawContent} noteNames={notes} className="pane-preview" style={{ "--pane-ratio": 1 - splitRatio } as React.CSSProperties} onWikiLinkClick={handleWikiLinkClick} />
              </>
            ) : splitDown && activeNote ? (
              <>
                <div className="pane-editor pane-enter" style={{ "--pane-ratio": splitRatio } as React.CSSProperties}>
                  <div className="editor-wrapper"><Suspense fallback={<div className="editor-placeholder" />}><NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} readableLineLength={readableLineLength} editorFont={editorFont} /></Suspense></div>
                </div>
                <div className="split-divider split-divider-v" onMouseDown={handleSplitMouseDown} />
                <NoteParser content={rawContent} noteNames={notes} className="pane-preview" style={{ "--pane-ratio": 1 - splitRatio } as React.CSSProperties} onWikiLinkClick={handleWikiLinkClick} />
              </>
            ) : (
              <>
                {!previewMode && activeNote && <div className="pane-editor pane-enter"><div className="editor-wrapper"><Suspense fallback={<div className="editor-placeholder" />}><NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} readableLineLength={readableLineLength} editorFont={editorFont} /></Suspense></div></div>}
                {previewMode && activeNote && <NoteParser content={rawContent} noteNames={notes} onWikiLinkClick={handleWikiLinkClick} />}
              </>
            )}
          </div>
          {showRightPanel && activeNote && (
            <RightPanel
              activeNote={activeNote}
              content={rawContent}
              backlinks={noteBacklinks}
              tags={sortedTags}
              onNavigate={openNote}
              activePanelTab={activePanelTab}
              onPanelTabChange={setActivePanelTab}
              onContentSave={handleContentChange}
              splitView={splitView}
              splitDown={splitDown}
              onToggleSplit={toggleSplitView}
              onToggleSplitDown={() => { setSplitDown(v => !v); setSplitView(false); }}
            />
          )}
        </div>
        <StatusBar content={rawContent} noteCount={notes.length} activeNote={activeNote} saved={saved} />
      </div>
      {showSearch && <CommandPalette notes={notes} onSelect={(file: string) => { setShowSearch(false); openNote(file); }} onClose={() => setShowSearch(false)} />}
      {showSettings && (
        <Suspense fallback={<LazyFallback />}>
          <ErrorBoundary name="Settings">
          <Settings
            onClose={() => setShowSettings(false)}
            onSwitchVault={handleSwitchVault}
            theme={theme}
            onThemeChange={setTheme}
            vaultPath={vaultPath}
            vimMode={vimMode}
            onVimModeChange={setVimMode}
            readableLineLength={readableLineLength}
            onReadableLineLengthChange={setReadableLineLength}
            editorFont={editorFont}
            onEditorFontChange={setEditorFont}
            spellcheck={spellcheckStore}
            onSpellcheckChange={setSpellcheck}
          />
          </ErrorBoundary>
        </Suspense>
      )}
      {showHelp && <Suspense fallback={<LazyFallback />}><ErrorBoundary name="Help"><Help onClose={() => setShowHelp(false)} /></ErrorBoundary></Suspense>}
      {showGraph && (
        <Suspense fallback={<LazyFallback />}>
          <ErrorBoundary name="GraphView">
          <GraphView notes={notes} backlinks={backlinksStore} activeNote={activeNote} onNodeClick={(note: string) => { setShowGraph(false); openNote(note); }} onClose={() => setShowGraph(false)} />
          </ErrorBoundary>
        </Suspense>
      )}
      {showGlobalSearch && (
        <Suspense fallback={<LazyFallback />}>
          <ErrorBoundary name="GlobalSearch">
          <GlobalSearch notes={notes} contents={allContents} vaultIndex={vaultIndex} onSelect={(note: string) => { setShowGlobalSearch(false); openNote(note); }} onClose={() => setShowGlobalSearch(false)} />
          </ErrorBoundary>
        </Suspense>
      )}
      {showTemplates && (
        <Suspense fallback={<LazyFallback />}><ErrorBoundary name="Templates"><TemplatesPanel onInsertTemplate={handleInsertTemplate} onClose={() => setShowTemplates(false)} /></ErrorBoundary></Suspense>
      )}
      {showBookmarks && (
        <Suspense fallback={<LazyFallback />}>
          <ErrorBoundary name="Bookmarks">
          <BookmarksPanel bookmarks={bookmarks} activeNote={activeNote} onToggleBookmark={toggleBookmark} onSelect={(note: string) => { setShowBookmarks(false); openNote(note); }} onClose={() => setShowBookmarks(false)} />
          </ErrorBoundary>
        </Suspense>
      )}
      {showCanvas && (
        <Suspense fallback={<LazyFallback />}><ErrorBoundary name="Canvas"><CanvasView vaultPath={vaultPath} onClose={() => setShowCanvas(false)} /></ErrorBoundary></Suspense>
      )}
      {showTrash && (
        <Suspense fallback={<LazyFallback />}>
          <ErrorBoundary name="Trash">
            <TrashPanel onClose={() => setShowTrash(false)} onRestore={async () => { const files = await refreshNotes(); await refreshBacklinks(files); }} />
          </ErrorBoundary>
        </Suspense>
      )}
      {renamingFile && (
        <div className="modal-overlay" onClick={() => setRenamingFile(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rename Note</h2>
              <button className="btn-icon" onClick={() => setRenamingFile(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <input className="rename-input" value={renameValue} onChange={(e) => setRenameValue(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenamingFile(null); }} autoFocus />
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setRenamingFile(null)}>Cancel</button>
                <button className="btn-secondary btn-accent" onClick={confirmRename}>Rename</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <InputDialog
        open={showNewNoteDialog}
        title="New Note"
        message="Enter note name:"
        placeholder="note-name"
        confirmLabel="Create"
        onConfirm={confirmNewNote}
        onCancel={() => setShowNewNoteDialog(false)}
      />
      <InputDialog
        open={showNewFolderDialog}
        title="New Folder"
        message="Enter folder name:"
        placeholder="folder-name"
        confirmLabel="Create"
        onConfirm={confirmNewFolder}
        onCancel={() => setShowNewFolderDialog(false)}
      />
      <InputDialog
        open={showWikiCreateDialog}
        title="Create Note"
        message={`Note "${wikiTarget?.split("/").pop()?.replace(/\.md$/, "") || ""}" does not exist. Create it?`}
        placeholder="Enter note name"
        defaultValue={wikiTarget?.replace(/\.md$/, "") || ""}
        confirmLabel="Create"
        onConfirm={confirmWikiCreate}
        onCancel={cancelWikiCreate}
      />
      <ConfirmDialog
        open={showCloseConfirmDialog}
        title="Unsaved Changes"
        message={`"${closingTabId?.split("/").pop()?.replace(/\.md$/, "") || ""}" has unsaved changes.`}
        variant="save-discard"
        onConfirm={handleSaveAndClose}
        onDiscard={handleDiscardAndClose}
        onCancel={handleCancelClose}
      />
      <ConfirmDialog
        open={showDeleteConfirmDialog}
        title="Delete Note"
        message={`Are you sure you want to delete "${deletingFile?.split("/").pop()?.replace(/\.md$/, "") || ""}"? The file will be moved to trash.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      {errorMessage && (
        <div className="toast-error" onClick={() => setErrorMessage(null)}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}
