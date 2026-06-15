import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Sidebar from "./Sidebar";
import NoteEditor from "./NoteEditor";
import NoteParser from "./NoteParser";
import CommandPalette from "./CommandPalette";
import VaultSetup from "./VaultSetup";
import StatusBar from "./StatusBar";
import TrafficLights from "./TrafficLights";
import Settings, { ThemeName } from "./Settings";
import Help from "./Help";
import ResizablePanel from "./ResizablePanel";
import LeftRibbon from "./LeftRibbon";
import TabBar, { Tab } from "./TabBar";
import RightPanel from "./RightPanel";
import GraphView from "./GraphView";
import GlobalSearch from "./GlobalSearch";
import TemplatesPanel from "./TemplatesPanel";
import BookmarksPanel from "./BookmarksPanel";
import { parseFrontmatter, buildBacklinks, buildTagIndex } from "../plugins/frontmatter";

const THEME_BG: Record<ThemeName, string> = {
  obsidian: "#1e1e1e",
  light: "#ffffff",
  dracula: "#282a36",
  nord: "#2e3440",
  solarized: "#002b36",
};

export default function App() {
  const [vaultReady, setVaultReady] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [splitView, setSplitView] = useState(() => localStorage.getItem("void-split-view") === "true");
  const [splitRatio, setSplitRatio] = useState(() => {
    const stored = localStorage.getItem("void-split-ratio");
    return stored ? parseFloat(stored) : 0.5;
  });
  const [splitDragging, setSplitDragging] = useState(false);
  const splitStartX = useRef(0);
  const splitStartRatio = useRef(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [vimMode, setVimMode] = useState(() => localStorage.getItem("void-vim-mode") === "true");
  const tagIndex = useRef<Map<string, string[]>>(new Map());
  const [backlinks, setBacklinks] = useState<Map<string, string[]>>(new Map());
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saved, setSaved] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [theme, setTheme] = useState<ThemeName>(() => {
    return (localStorage.getItem("void-notes-theme") as ThemeName) || "obsidian";
  });
  const allContents = useRef<Map<string, string>>(new Map());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tab system
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Right panel
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activePanelTab, setActivePanelTab] = useState<"backlinks" | "tags" | "outline">("backlinks");

  // Graph view
  const [showGraph, setShowGraph] = useState(false);

  // Global search
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Templates
  const [showTemplates, setShowTemplates] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const stored = localStorage.getItem("void-bookmarks");
    return stored ? JSON.parse(stored) : [];
  });
  const [showBookmarks, setShowBookmarks] = useState(false);

  // --- Refs for stable closures ---
  const activeNoteRef = useRef(activeNote);
  const rawContentRef = useRef(rawContent);
  const notesRef = useRef(notes);
  const vaultPathRef = useRef(vaultPath);
  useEffect(() => { activeNoteRef.current = activeNote; }, [activeNote]);
  useEffect(() => { rawContentRef.current = rawContent; }, [rawContent]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { vaultPathRef.current = vaultPath; }, [vaultPath]);

  const handleVaultSelect = useCallback(async (p: string) => {
    await window.electronAPI.setVault(p);
    setVaultPath(p);
    setVaultReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("void-notes-theme", theme);
    window.electronAPI.setBackground(THEME_BG[theme]);
  }, [theme]);

  useEffect(() => {
    window.electronAPI.getVault().then((p) => {
      if (p) {
        setVaultPath(p);
        setVaultReady(true);
      }
    });
  }, []);

  const refreshNotes = useCallback(async () => {
    const files = await window.electronAPI.listNotes();
    setNotes(files);
    return files;
  }, []);

  const refreshBacklinks = useCallback(async (files: string[]) => {
    const entries = await Promise.all(
      files.map(async (file) => {
        const content = await window.electronAPI.loadNote(file);
        return [file, content] as const;
      })
    );
    const contents = new Map<string, string>(entries);
    allContents.current = contents;
    setBacklinks(buildBacklinks(contents));
    tagIndex.current = buildTagIndex(contents);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const filteredNotes = useMemo(() => {
    if (selectedTags.length === 0) return notes;
    return notes.filter((file) =>
      selectedTags.every((tag) => {
        const files = tagIndex.current.get(tag);
        return files && files.includes(file);
      })
    );
  }, [notes, selectedTags]);

  const sortedTags = useMemo(
    () => Array.from(tagIndex.current.keys()).sort(),
    [backlinks]
  );

  const openNote = useCallback(async (fileName: string) => {
    setActiveNote(fileName);
    setActiveTabId(fileName);
    const content = await window.electronAPI.loadNote(fileName);
    setRawContent(content);
    setPreviewMode(false);
    setSaved(true);

    // Add to tabs if not already open
    setOpenTabs((prev) => {
      if (prev.some((t) => t.id === fileName)) return prev;
      const label = fileName.split("/").pop()?.replace(/\.md$/, "") || fileName;
      return [...prev, { id: fileName, label, dirty: false }];
    });
  }, []);

  const handleNewNote = useCallback(async () => {
    const fileName = await window.electronAPI.createNote();
    if (!fileName) return;
    const files = await refreshNotes();
    await refreshBacklinks(files);
    await openNote(fileName);
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleNewFolder = useCallback(async () => {
    // Placeholder - will implement folder creation
  }, []);

  const handleDailyNote = useCallback(async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const fileName = `${yyyy}-${mm}-${dd}.md`;
    const files = await refreshNotes();
    if (files.includes(fileName)) {
      await openNote(fileName);
      return;
    }
    await window.electronAPI.createNote(fileName);
    const newFiles = await refreshNotes();
    await refreshBacklinks(newFiles);
    await openNote(fileName);
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleDeleteNote = useCallback(async (fileName: string) => {
    const ok = await window.electronAPI.deleteNote(fileName);
    if (!ok) return;
    if (activeNote === fileName) {
      setActiveNote(null);
      setRawContent("");
    }
    // Remove from tabs
    setOpenTabs((prev) => prev.filter((t) => t.id !== fileName));
    if (activeTabId === fileName) {
      setActiveTabId(null);
    }
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [activeNote, activeTabId, refreshNotes, refreshBacklinks]);

  const handleRenameNote = useCallback((oldName: string) => {
    const baseName = oldName.split("/").pop()?.replace(/\.md$/, "") || oldName;
    setRenamingFile(oldName);
    setRenameValue(baseName);
  }, []);

  const confirmRename = useCallback(async () => {
    if (!renamingFile || !renameValue.trim()) return;
    const result = await window.electronAPI.renameNote(renamingFile, renameValue.trim());
    if (!result) return;
    if (activeNote === renamingFile) setActiveNote(result);
    setRenamingFile(null);
    setRenameValue("");
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [renamingFile, renameValue, activeNote, refreshNotes, refreshBacklinks]);

  const handleContentChange = useCallback((value: string) => {
    setRawContent(value);
    setSaved(false);

    // Mark tab as dirty
    if (activeNote) {
      setOpenTabs((prev) =>
        prev.map((t) => (t.id === activeNote ? { ...t, dirty: true } : t))
      );
    }

    if (!activeNote) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await window.electronAPI.saveNote(activeNote, value);
      setSaved(true);
      allContents.current.set(activeNote, value);
      setBacklinks(buildBacklinks(allContents.current));
      tagIndex.current = buildTagIndex(allContents.current);

      // Mark tab as clean after save
      setOpenTabs((prev) =>
        prev.map((t) => (t.id === activeNote ? { ...t, dirty: false } : t))
      );
    }, 500);
  }, [activeNote]);

  const handleManualSaveRef = useRef<() => void>(() => {});
  const handleNewNoteRef = useRef<() => void>(() => {});

  const handleManualSave = useCallback(async () => {
    if (!activeNote) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await window.electronAPI.saveNote(activeNote, rawContent);
    setSaved(true);
    allContents.current.set(activeNote, rawContent);
    setBacklinks(buildBacklinks(allContents.current));
    tagIndex.current = buildTagIndex(allContents.current);

    // Mark tab as clean
    setOpenTabs((prev) =>
      prev.map((t) => (t.id === activeNote ? { ...t, dirty: false } : t))
    );
  }, [activeNote, rawContent]);

  useEffect(() => { handleManualSaveRef.current = handleManualSave; }, [handleManualSave]);
  useEffect(() => { handleNewNoteRef.current = handleNewNote; }, [handleNewNote]);

  const handleWikiLinkClick = useCallback(async (target: string) => {
    const fileName = target.endsWith(".md") ? target : `${target}.md`;
    if (notes.includes(fileName)) await openNote(fileName);
  }, [notes, openNote]);

  const handleInsertTemplate = useCallback((content: string) => {
    setRawContent(content);
    handleContentChange(content);
  }, [handleContentChange]);

  const toggleBookmark = useCallback((note: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note];
      localStorage.setItem("void-bookmarks", JSON.stringify(next));
      return next;
    });
  }, []);

  const togglePreview = useCallback(() => setPreviewMode((prev) => !prev), []);

  const toggleSplitView = useCallback(() => {
    setSplitView((prev) => {
      const next = !prev;
      localStorage.setItem("void-split-view", String(next));
      return next;
    });
  }, []);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setSplitDragging(true);
    splitStartX.current = e.clientX;
    splitStartRatio.current = splitRatio;
  }, [splitRatio]);

  useEffect(() => {
    if (!splitDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector(".pane-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const delta = e.clientX - splitStartX.current;
      const newRatio = Math.min(0.9, Math.max(0.1, splitStartRatio.current + delta / rect.width));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setSplitDragging(false);
      localStorage.setItem("void-split-ratio", String(splitRatio));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [splitDragging, splitRatio]);

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
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleDailyNoteRef = useRef(handleDailyNote);
  useEffect(() => { handleDailyNoteRef.current = handleDailyNote; }, [handleDailyNote]);

  useEffect(() => {
    if (!vaultReady) return;
    refreshNotes().then((files) => {
      refreshBacklinks(files);
      if (files.length > 0) openNote(files[0]);
    });
  }, [vaultReady]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "e") { e.preventDefault(); togglePreview(); }
      if (e.ctrlKey && e.shiftKey && e.key === "E") { e.preventDefault(); toggleSplitView(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); setShowSearch((v) => !v); }
      if (e.ctrlKey && e.shiftKey && e.key === "F") { e.preventDefault(); setShowGlobalSearch((v) => !v); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleManualSaveRef.current(); }
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); handleNewNoteRef.current(); }
      if (e.ctrlKey && e.shiftKey && e.key === "N") { e.preventDefault(); handleDailyNoteRef.current(); }
      if (e.ctrlKey && e.key === ",") { e.preventDefault(); setShowSettings((v) => !v); }
      if (e.key === "F1") { e.preventDefault(); setShowHelp((v) => !v); }
      if (e.key === "F9") { e.preventDefault(); setFocusMode((v) => !v); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePreview, toggleSplitView]);

  const noteBacklinks = activeNote ? (backlinks.get(activeNote) || []) : [];

  // Tab handlers
  const handleTabSelect = useCallback((id: string) => {
    openNote(id);
  }, [openNote]);

  const handleTabClose = useCallback((id: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id) {
      const remaining = openTabs.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        openNote(remaining[remaining.length - 1].id);
      } else {
        setActiveNote(null);
        setRawContent("");
        setActiveTabId(null);
      }
    }
  }, [activeTabId, openTabs, openNote]);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setOpenTabs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  if (!vaultReady) {
    return <VaultSetup onVaultSelect={handleVaultSelect} />;
  }

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
          onOpenSettings={() => setShowSettings(true)}
          onOpenSearch={() => setShowSearch(true)}
          activePanel={showGraph ? "graph" : showTemplates ? "templates" : showBookmarks ? "bookmarks" : null}
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
            onToggleFocusMode={() => setFocusMode((v) => !v)}
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      <div className="editor-area">
        {!focusMode && openTabs.length > 0 && (
          <TabBar
            tabs={openTabs}
            activeTab={activeTabId}
            onSelect={handleTabSelect}
            onClose={handleTabClose}
            onReorder={handleTabReorder}
          />
        )}

        <div className="top-bar">
          <div className="top-bar-left">
            <div className="breadcrumb">
              {activeNote ? (
                <span className="breadcrumb-current">
                  {activeNote.split("/").pop()?.replace(/\.md$/, "") || ""}
                </span>
              ) : (
                <span>No note open</span>
              )}
            </div>
          </div>
          <div className="top-bar-actions">
            <button className={`btn-mode ${!splitView ? "active" : ""}`} onClick={() => { setPreviewMode((v) => !v); setSplitView(false); }}>
              {previewMode ? "Edit" : "Preview"}
            </button>
            <button className={`btn-mode ${splitView ? "active" : ""}`} onClick={toggleSplitView} title="Split view (Ctrl+Shift+E)">
              Split
            </button>
            <button
              className={`btn-mode ${showRightPanel ? "active" : ""}`}
              onClick={() => setShowRightPanel((v) => !v)}
              title="Toggle right panel"
            >
              Panel
            </button>
            <div className="top-bar-separator" />
            <TrafficLights />
          </div>
        </div>

        <div className="main-content">
          <div className={`pane-container ${splitView ? "split-view" : ""}`} style={{ "--split-ratio": splitRatio } as React.CSSProperties}>
            {splitView && activeNote ? (
              <>
                <div className="pane-editor pane-enter" style={{ flex: `0 0 ${splitRatio * 100}%` } as React.CSSProperties}>
                  <div className="editor-wrapper">
                    <NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} />
                  </div>
                </div>
                <div
                  className="split-divider"
                  onMouseDown={handleSplitMouseDown}
                  style={{ cursor: "col-resize" } as React.CSSProperties}
                />
                <NoteParser content={rawContent} noteNames={notes} className="pane-preview" style={{ flex: `0 0 ${(1 - splitRatio) * 100}%` } as React.CSSProperties} onWikiLinkClick={handleWikiLinkClick} />
              </>
            ) : (
              <>
                {!previewMode && activeNote && (
                  <div className="pane-editor pane-enter">
                    <div className="editor-wrapper">
                      <NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} />
                    </div>
                  </div>
                )}
                {previewMode && activeNote && (
                  <NoteParser content={rawContent} noteNames={notes} onWikiLinkClick={handleWikiLinkClick} />
                )}
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
            />
          )}
        </div>

        <StatusBar content={rawContent} noteCount={notes.length} activeNote={activeNote} saved={saved} />
      </div>

      {showSearch && (
        <CommandPalette notes={notes} onSelect={(file) => { setShowSearch(false); openNote(file); }} onClose={() => setShowSearch(false)} />
      )}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} onSwitchVault={handleSwitchVault} theme={theme} onThemeChange={setTheme} vaultPath={vaultPath} vimMode={vimMode} onVimModeChange={(v) => { setVimMode(v); localStorage.setItem("void-vim-mode", String(v)); }} />
      )}
      {showHelp && <Help onClose={() => setShowHelp(false)} />}
      {showGraph && (
        <GraphView
          notes={notes}
          backlinks={backlinks}
          activeNote={activeNote}
          onNodeClick={(note) => { setShowGraph(false); openNote(note); }}
          onClose={() => setShowGraph(false)}
        />
      )}
      {showGlobalSearch && (
        <GlobalSearch
          notes={notes}
          contents={allContents.current}
          onSelect={(note) => { setShowGlobalSearch(false); openNote(note); }}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}
      {showTemplates && (
        <TemplatesPanel
          onInsertTemplate={handleInsertTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
      {showBookmarks && (
        <BookmarksPanel
          bookmarks={bookmarks}
          activeNote={activeNote}
          onToggleBookmark={toggleBookmark}
          onSelect={(note) => { setShowBookmarks(false); openNote(note); }}
          onClose={() => setShowBookmarks(false)}
        />
      )}

      {renamingFile && (
        <div className="modal-overlay" onClick={() => setRenamingFile(null)}>
          <div className="modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rename Note</h2>
              <button className="btn-icon" onClick={() => setRenamingFile(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <input className="rename-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenamingFile(null); }} autoFocus />
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
