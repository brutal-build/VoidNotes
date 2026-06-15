import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Sidebar from "./Sidebar";
import NoteEditor from "./NoteEditor";
import NoteParser from "./NoteParser";
import CommandPalette from "./CommandPalette";
import VaultSetup from "./VaultSetup";
import ModeSelection, { AppMode } from "./ModeSelection";
import StatusBar from "./StatusBar";
import TrafficLights from "./TrafficLights";
import Settings, { ThemeName } from "./Settings";
import Help from "./Help";
import ResizablePanel from "./ResizablePanel";
import { parseFrontmatter, buildBacklinks, buildTagIndex } from "../plugins/frontmatter";

const THEME_BG: Record<ThemeName, string> = {
  obsidian: "#1e1e1e",
  light: "#ffffff",
  dracula: "#282a36",
  nord: "#2e3440",
  solarized: "#002b36",
};

export default function App() {
  const [mode] = useState<AppMode>("minimalistic");
  const [vaultReady, setVaultReady] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [splitView, setSplitView] = useState(() => localStorage.getItem("void-split-view") === "true");
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
    const content = await window.electronAPI.loadNote(fileName);
    setRawContent(content);
    setPreviewMode(false);
    setSaved(true);
  }, []);

  const handleNewNote = useCallback(async () => {
    const fileName = await window.electronAPI.createNote();
    if (!fileName) return;
    const files = await refreshNotes();
    await refreshBacklinks(files);
    await openNote(fileName);
  }, [refreshNotes, refreshBacklinks, openNote]);

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
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [activeNote, refreshNotes, refreshBacklinks]);

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
    if (!activeNote) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await window.electronAPI.saveNote(activeNote, value);
      setSaved(true);
      allContents.current.set(activeNote, value);
      setBacklinks(buildBacklinks(allContents.current));
      tagIndex.current = buildTagIndex(allContents.current);
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
  }, [activeNote, rawContent]);

  useEffect(() => { handleManualSaveRef.current = handleManualSave; }, [handleManualSave]);
  useEffect(() => { handleNewNoteRef.current = handleNewNote; }, [handleNewNote]);

  const handleWikiLinkClick = useCallback(async (target: string) => {
    const fileName = target.endsWith(".md") ? target : `${target}.md`;
    if (notes.includes(fileName)) await openNote(fileName);
  }, [notes, openNote]);

  const togglePreview = useCallback(() => setPreviewMode((prev) => !prev), []);

  const toggleSplitView = useCallback(() => {
    setSplitView((prev) => {
      const next = !prev;
      localStorage.setItem("void-split-view", String(next));
      return next;
    });
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
  }, [refreshNotes, refreshBacklinks, openNote]);

  const handleDailyNoteRef = useRef(handleDailyNote);
  useEffect(() => { handleDailyNoteRef.current = handleDailyNote; }, [handleDailyNote]);

  useEffect(() => {
    if (!vaultReady) return;
    refreshNotes().then((files) => {
      refreshBacklinks(files);
      if (files.length > 0) openNote(files[0]);
    });
  }, [vaultReady, mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "e") { e.preventDefault(); togglePreview(); }
      if (e.ctrlKey && e.shiftKey && e.key === "E") { e.preventDefault(); toggleSplitView(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); setShowSearch((v) => !v); }
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

  if (!vaultReady) {
    return <VaultSetup onVaultSelect={handleVaultSelect} />;
  }

  return (
    <div className="app">
      {focusMode ? (
        <button className="focus-restore-btn" onClick={() => setFocusMode(false)} title="Show sidebar (F9)">
          &#9776;
        </button>
      ) : (
        <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400} storageKey="void-sidebar-width">
          <Sidebar
            notes={filteredNotes}
            allNotes={notes}
            activeNote={activeNote}
            focusMode={focusMode}
            vaultPath={vaultPath}
            tags={sortedTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onToggleFocusMode={() => setFocusMode((v) => !v)}
            onSelect={openNote}
            onNew={handleNewNote}
            onDelete={handleDeleteNote}
            onRename={handleRenameNote}
            onOpenSearch={() => setShowSearch(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenHelp={() => setShowHelp(true)}
          />
        </ResizablePanel>
      )}

      <div className="editor-area">
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
            <div className="top-bar-separator" />
            <TrafficLights />
          </div>
        </div>

        <div className={`pane-container ${splitView ? "split-view" : ""}`}>
          {splitView && activeNote ? (
            <>
              <div className="pane-editor pane-enter">
                <div className="editor-wrapper">
                  <NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} vimMode={vimMode} />
                </div>
              </div>
              <div className="split-divider" />
              <NoteParser content={rawContent} noteNames={notes} onWikiLinkClick={handleWikiLinkClick} />
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

        <StatusBar content={rawContent} noteCount={notes.length} activeNote={activeNote} saved={saved} />
      </div>

      {showSearch && (
        <CommandPalette notes={notes} onSelect={(file) => { setShowSearch(false); openNote(file); }} onClose={() => setShowSearch(false)} />
      )}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} onSwitchVault={handleSwitchVault} theme={theme} onThemeChange={setTheme} vaultPath={vaultPath} vimMode={vimMode} onVimModeChange={(v) => { setVimMode(v); localStorage.setItem("void-vim-mode", String(v)); }} />
      )}
      {showHelp && <Help onClose={() => setShowHelp(false)} />}

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
