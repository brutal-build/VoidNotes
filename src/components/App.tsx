import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./Sidebar";
import NoteEditor from "./NoteEditor";
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
import { parseFrontmatter, buildBacklinks, buildTagIndex } from "../plugins/frontmatter";
import { useAppStore, useFilteredNotes, useSortedTags, useNoteBacklinks } from "../store/useAppStore";
import type { ThemeName, Tab, ActivePanel } from "../types";

// Lazy-loaded — these are opened modally and don't need to load upfront
const Settings = React.lazy(() => import("./Settings"));
const Help = React.lazy(() => import("./Help"));
const GraphView = React.lazy(() => import("./GraphView"));
const GlobalSearch = React.lazy(() => import("./GlobalSearch"));
const TemplatesPanel = React.lazy(() => import("./TemplatesPanel"));
const BookmarksPanel = React.lazy(() => import("./BookmarksPanel"));
const CanvasView = React.lazy(() => import("./CanvasView"));

function LazyFallback() {
  return <div className="lazy-loading" style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading...</div>;
}

const THEME_BG: Record<ThemeName, string> = {
  obsidian: "#1e1e1e",
  light: "#ffffff",
  dracula: "#282a36",
  nord: "#2e3440",
  solarized: "#002b36",
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
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const toggleTag = useAppStore((s) => s.toggleTag);
  const setRenamingFile = useAppStore((s) => s.setRenamingFile);
  const setRenameValue = useAppStore((s) => s.setRenameValue);

  const handleVaultSelect = useCallback(async (p: string) => {
    await window.electronAPI.setVault(p);
    setVaultPath(p);
    setVaultReady(true);
  }, [setVaultPath, setVaultReady]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.electronAPI.setBackground(THEME_BG[theme]);
  }, [theme]);

  useEffect(() => {
    window.electronAPI.getVault().then((p) => {
      if (p) { setVaultPath(p); setVaultReady(true); }
    });
  }, [setVaultPath, setVaultReady]);

  const refreshNotes = useCallback(async () => {
    const files = await window.electronAPI.listNotes();
    setNotes(files);
    return files;
  }, [setNotes]);

  const refreshBacklinks = useCallback(async (files: string[]) => {
    const entries = await Promise.all(files.map(async (file) => {
      const content = await window.electronAPI.loadNote(file);
      return [file, content] as const;
    }));
    const contents = new Map<string, string>(entries);
    setAllContents(contents);
    setBacklinks(buildBacklinks(contents));
    setTagIndex(buildTagIndex(contents));
  }, [setAllContents, setBacklinks, setTagIndex]);

  const openNote = useCallback(async (fileName: string) => {
    setActiveNote(fileName);
    setActiveTabId(fileName);
    const content = await window.electronAPI.loadNote(fileName);
    setRawContent(content);
    setPreviewMode(false);
    setSaved(true);
    setOpenTabs((prev: Tab[]) => {
      if (prev.some((t) => t.id === fileName)) return prev;
      const label = fileName.split("/").pop()?.replace(/\.md$/, "") || fileName;
      return [...prev, { id: fileName, label, dirty: false }];
    });
  }, [setActiveNote, setActiveTabId, setRawContent, setPreviewMode, setSaved, setOpenTabs]);

  const handleNewNote = useCallback(async () => {
    const fileName = await window.electronAPI.createNote();
    if (!fileName) return;
    const files = await refreshNotes();
    await refreshBacklinks(files);
    await openNote(fileName);
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleNewFolder = useCallback(async () => {
    const folderName = window.prompt("Enter folder name:");
    if (!folderName || !folderName.trim()) return;
    const ok = await window.electronAPI.createFolder(folderName.trim());
    if (!ok) return;
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [refreshNotes, refreshBacklinks]);

  const handleDailyNote = useCallback(async () => {
    const today = new Date();
    const fileName = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.md`;
    const files = await refreshNotes();
    if (files.includes(fileName)) { await openNote(fileName); return; }
    await window.electronAPI.createNote(fileName);
    const newFiles = await refreshNotes();
    await refreshBacklinks(newFiles);
    await openNote(fileName);
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleDeleteNote = useCallback(async (fileName: string) => {
    const ok = await window.electronAPI.deleteNote(fileName);
    if (!ok) return;
    if (activeNote === fileName) { setActiveNote(null); setRawContent(""); }
    setOpenTabs((prev: Tab[]) => prev.filter((t) => t.id !== fileName));
    if (activeTabId === fileName) setActiveTabId(null);
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [activeNote, activeTabId, setActiveNote, setRawContent, setOpenTabs, setActiveTabId, refreshNotes, refreshBacklinks]);

  const handleRenameNote = useCallback((oldName: string) => {
    const baseName = oldName.split("/").pop()?.replace(/\.md$/, "") || oldName;
    setRenamingFile(oldName);
    setRenameValue(baseName);
  }, [setRenamingFile, setRenameValue]);

  const confirmRename = useCallback(async () => {
    if (!renamingFile || !renameValue.trim()) return;
    const result = await window.electronAPI.renameNote(renamingFile, renameValue.trim());
    if (!result) return;
    if (activeNote === renamingFile) setActiveNote(result);
    setRenamingFile(null);
    setRenameValue("");
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [renamingFile, renameValue, activeNote, setActiveNote, setRenamingFile, setRenameValue, refreshNotes, refreshBacklinks]);

  const handleContentChange = useCallback((value: string) => {
    setRawContent(value);
    setSaved(false);
    if (activeNote) {
      setOpenTabs((prev: Tab[]) => prev.map((t) => (t.id === activeNote ? { ...t, dirty: true } : t)));
    }
    if (!activeNote) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await window.electronAPI.saveNote(activeNote, value);
      setSaved(true);
      const store = useAppStore.getState();
      const contents = new Map(store.allContents);
      contents.set(activeNote, value);
      setAllContents(contents);
      setBacklinks(buildBacklinks(contents));
      setTagIndex(buildTagIndex(contents));
      setOpenTabs((prev: Tab[]) => prev.map((t) => (t.id === activeNote ? { ...t, dirty: false } : t)));
    }, 500);
  }, [activeNote, setRawContent, setSaved, setOpenTabs, setAllContents, setBacklinks, setTagIndex]);

  const handleManualSave = useCallback(async () => {
    const store = useAppStore.getState();
    const note = store.activeNote;
    const content = store.rawContent;
    if (!note) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await window.electronAPI.saveNote(note, content);
    setSaved(true);
    const contents = new Map(store.allContents);
    contents.set(note, content);
    setAllContents(contents);
    setBacklinks(buildBacklinks(contents));
    setTagIndex(buildTagIndex(contents));
    setOpenTabs((prev: Tab[]) => prev.map((t) => (t.id === note ? { ...t, dirty: false } : t)));
  }, [setSaved, setAllContents, setBacklinks, setTagIndex, setOpenTabs]);

  const handleWikiLinkClick = useCallback(async (target: string) => {
    const fileName = target.endsWith(".md") ? target : `${target}.md`;
    const currentNotes = useAppStore.getState().notes;
    if (currentNotes.includes(fileName)) await openNote(fileName);
  }, [openNote]);

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
    const selectedPath = await window.electronAPI.selectVault();
    if (selectedPath) {
      await window.electronAPI.setVault(selectedPath);
      setVaultPath(selectedPath);
      const files = await refreshNotes();
      await refreshBacklinks(files);
      if (files.length > 0) openNote(files[0]);
    }
  }, [setShowSettings, setVaultPath, refreshNotes, refreshBacklinks, openNote]);

  useEffect(() => {
    if (!vaultReady) return;
    refreshNotes().then((files) => {
      refreshBacklinks(files);
      if (files.length > 0) openNote(files[0]);
    });
  }, [vaultReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "e") { e.preventDefault(); togglePreview(); }
      if (e.ctrlKey && e.shiftKey && e.key === "E") { e.preventDefault(); toggleSplitView(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); setShowSearch((v: boolean) => !v); }
      if (e.ctrlKey && e.shiftKey && e.key === "F") { e.preventDefault(); setShowGlobalSearch((v: boolean) => !v); }
      if (e.ctrlKey && e.key === "t") { e.preventDefault(); setShowTemplates((v: boolean) => !v); }
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
  const handleTabClose = useCallback((id: string) => {
    const currentTabs = useAppStore.getState().openTabs;
    setOpenTabs(currentTabs.filter((t) => t.id !== id));
    if (activeTabId === id) {
      const remaining = currentTabs.filter((t) => t.id !== id);
      if (remaining.length > 0) openNote(remaining[remaining.length - 1].id);
      else { setActiveNote(null); setRawContent(""); setActiveTabId(null); }
    }
  }, [activeTabId, setOpenTabs, setActiveNote, setRawContent, setActiveTabId, openNote]);

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
      {focusMode && (
        <button className="focus-restore-btn" onClick={() => setFocusMode(false)} title="Show sidebar (F9)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      )}
      <div className="editor-area">
        {!focusMode && openTabs.length > 0 && (
          <TabBar tabs={openTabs} activeTab={activeTabId} onSelect={handleTabSelect} onClose={handleTabClose} onReorder={handleTabReorder} />
        )}
        <div className="top-bar">
          <div className="top-bar-left">
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
                <div className="pane-editor pane-enter" style={{ flex: `0 0 ${splitRatio * 100}%` }}>
                  <div className="editor-wrapper"><NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} readableLineLength={readableLineLength} editorFont={editorFont} /></div>
                </div>
                <div className="split-divider split-divider-h" onMouseDown={handleSplitMouseDown} style={{ cursor: "col-resize" }} />
                <NoteParser content={rawContent} noteNames={notes} className="pane-preview" style={{ flex: `0 0 ${(1 - splitRatio) * 100}%` }} onWikiLinkClick={handleWikiLinkClick} />
              </>
            ) : splitDown && activeNote ? (
              <>
                <div className="pane-editor pane-enter" style={{ flex: `0 0 ${splitRatio * 100}%` }}>
                  <div className="editor-wrapper"><NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} readableLineLength={readableLineLength} editorFont={editorFont} /></div>
                </div>
                <div className="split-divider split-divider-v" onMouseDown={handleSplitMouseDown} style={{ cursor: "row-resize" }} />
                <NoteParser content={rawContent} noteNames={notes} className="pane-preview" style={{ flex: `0 0 ${(1 - splitRatio) * 100}%` }} onWikiLinkClick={handleWikiLinkClick} />
              </>
            ) : (
              <>
                {!previewMode && activeNote && <div className="pane-editor pane-enter"><div className="editor-wrapper"><NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} readableLineLength={readableLineLength} editorFont={editorFont} /></div></div>}
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
              onToggleSplitDown={() => { setSplitDown(v => !v); setPreviewMode(false); setSplitView(false); }}
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
          <GlobalSearch notes={notes} contents={allContents} onSelect={(note: string) => { setShowGlobalSearch(false); openNote(note); }} onClose={() => setShowGlobalSearch(false)} />
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
        <Suspense fallback={<LazyFallback />}><ErrorBoundary name="Canvas"><CanvasView onClose={() => setShowCanvas(false)} /></ErrorBoundary></Suspense>
      )}
      {renamingFile && (
        <div className="modal-overlay" onClick={() => setRenamingFile(null)}>
          <div className="modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rename Note</h2>
              <button className="btn-icon" onClick={() => setRenamingFile(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <input className="rename-input" value={renameValue} onChange={(e) => setRenameValue(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenamingFile(null); }} autoFocus />
              <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
                <button className="btn-secondary" onClick={() => setRenamingFile(null)}>Cancel</button>
                <button className="btn-secondary" style={{ background: "var(--accent)", color: "#fff", border: "none" }} onClick={confirmRename}>Rename</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
