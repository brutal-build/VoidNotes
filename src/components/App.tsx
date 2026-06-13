import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "./Sidebar";
import NoteEditor from "./NoteEditor";
import NoteParser from "./NoteParser";
import CommandPalette from "./CommandPalette";
import VaultSetup from "./VaultSetup";
import StatusBar from "./StatusBar";
import TrafficLights from "./TrafficLights";
import Settings from "./Settings";
import Help from "./Help";
import { parseFrontmatter, buildBacklinks } from "../plugins/frontmatter";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export default function App() {
  const [vaultReady, setVaultReady] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [backlinks, setBacklinks] = useState<Map<string, string[]>>(new Map());
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saved, setSaved] = useState(true);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const allContents = useRef<Map<string, string>>(new Map());

  const handleVaultSelect = useCallback(async (p: string) => {
    await window.electronAPI.setVault(p);
    setVaultReady(true);
  }, []);

  useEffect(() => {
    window.electronAPI.getVault().then((p) => {
      if (p) setVaultReady(true);
    });
  }, []);

  const refreshNotes = useCallback(async () => {
    const files = await window.electronAPI.listNotes();
    setNotes(files);
    return files;
  }, []);

  const refreshBacklinks = useCallback(async (files: string[]) => {
    const contents = new Map<string, string>();
    for (const file of files) {
      const content = await window.electronAPI.loadNote(file);
      contents.set(file, content);
    }
    allContents.current = contents;
    setBacklinks(buildBacklinks(contents));
  }, []);

  const openNote = useCallback(async (fileName: string) => {
    setActiveNote(fileName);
    const content = await window.electronAPI.loadNote(fileName);
    setRawContent(content);
    setPreviewMode(false);
    setSaved(true);
    const stat = await window.electronAPI.statNote(fileName);
    if (stat) setLastModified(stat.mtime);
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
      setLastModified(null);
    }
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [activeNote, refreshNotes, refreshBacklinks]);

  const handleContentChange = useCallback((value: string) => {
    setRawContent(value);
    setSaved(false);
    if (!activeNote) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      await window.electronAPI.saveNote(activeNote, value);
      setSaved(true);
      const stat = await window.electronAPI.statNote(activeNote);
      if (stat) setLastModified(stat.mtime);
      const files = await window.electronAPI.listNotes();
      refreshBacklinks(files);
    }, 500);
  }, [activeNote, refreshBacklinks]);

  const handleManualSave = useCallback(async () => {
    if (!activeNote) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    await window.electronAPI.saveNote(activeNote, rawContent);
    setSaved(true);
    const stat = await window.electronAPI.statNote(activeNote);
    if (stat) setLastModified(stat.mtime);
  }, [activeNote, rawContent]);

  const handleWikiLinkClick = useCallback(async (target: string) => {
    const fileName = target.endsWith(".md") ? target : `${target}.md`;
    if (notes.includes(fileName)) {
      await openNote(fileName);
    }
  }, [notes, openNote]);

  const togglePreview = useCallback(() => {
    setPreviewMode((prev) => !prev);
  }, []);

  const handleSwitchVault = useCallback(async () => {
    setShowSettings(false);
    const vaultPath = await window.electronAPI.selectVault();
    if (vaultPath) {
      await window.electronAPI.setVault(vaultPath);
      const files = await refreshNotes();
      await refreshBacklinks(files);
      if (files.length > 0) openNote(files[0]);
    }
  }, [refreshNotes, refreshBacklinks, openNote]);

  useEffect(() => {
    if (!vaultReady) return;
    refreshNotes().then((files) => {
      refreshBacklinks(files);
      if (files.length > 0) openNote(files[0]);
    });
  }, [vaultReady, refreshNotes, refreshBacklinks, openNote]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "e") { e.preventDefault(); togglePreview(); }
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); setShowSearch((v) => !v); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleManualSave(); }
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); handleNewNote(); }
      if (e.ctrlKey && e.shiftKey && e.key === "N") { e.preventDefault(); handleDailyNote(); }
      if (e.ctrlKey && e.key === ",") { e.preventDefault(); setShowSettings((v) => !v); }
      if (e.key === "F1") { e.preventDefault(); setShowHelp((v) => !v); }
      if (e.key === "F9") { e.preventDefault(); setFocusMode((v) => !v); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePreview, handleManualSave, handleNewNote]);

  if (!vaultReady) {
    return <VaultSetup onVaultSelect={handleVaultSelect} />;
  }

  const { data: frontmatter } = parseFrontmatter(rawContent);
  const noteBacklinks = activeNote ? (backlinks.get(activeNote) || []) : [];
  const noteDate = lastModified ? new Date(lastModified).toLocaleString() : null;

  return (
    <div className="app">
      <Sidebar
        notes={notes}
        activeNote={activeNote}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((v) => !v)}
        onSelect={openNote}
        onNew={handleNewNote}
        onDelete={handleDeleteNote}
        onOpenSearch={() => setShowSearch(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHelp={() => setShowHelp(true)}
      />

      <div className="editor-area">
        <div className="top-bar">
          <div className="top-bar-left">
            <TrafficLights />
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
            <button className={`btn-mode ${previewMode ? "" : "active"}`} onClick={togglePreview}>
              Edit
            </button>
            <button className={`btn-mode ${previewMode ? "active" : ""}`} onClick={togglePreview}>
              Preview
            </button>
          </div>
        </div>

        <div className="pane-container">
          {!previewMode && activeNote && (
            <div className="pane-editor pane-enter">
              <div className="editor-wrapper">
                <NoteEditor content={rawContent} onChange={handleContentChange} noteNames={notes} />
              </div>
            </div>
          )}
          {previewMode && activeNote && (
            <NoteParser content={rawContent} noteNames={notes} onWikiLinkClick={handleWikiLinkClick} />
          )}
        </div>

        <StatusBar content={rawContent} noteCount={notes.length} activeNote={activeNote} saved={saved} />
      </div>

      {(noteBacklinks.length > 0 || noteDate) && (
        <div className="right-panel">
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="right-panel-section">
              <div className="right-panel-title">Tags</div>
              {frontmatter.tags.map((tag: string) => (
                <span key={tag} style={{
                  display: "inline-block",
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  marginRight: "4px",
                  marginBottom: "4px",
                }}>#{tag}</span>
              ))}
            </div>
          )}
          {noteDate && (
            <div className="right-panel-section">
              <div className="right-panel-title">Info</div>
              <div className="meta-item">
                <span className="meta-label">Modified</span>
                <span className="meta-value">{noteDate}</span>
              </div>
            </div>
          )}
          {noteBacklinks.length > 0 && (
            <div className="right-panel-section">
              <div className="right-panel-title">Backlinks</div>
              {noteBacklinks.map((file) => (
                <div key={file} className="backlink-item" onClick={() => openNote(file)}>
                  {file.split("/").pop()?.replace(/\.md$/, "") || file}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSearch && (
        <CommandPalette
          notes={notes}
          onSelect={(file) => { setShowSearch(false); openNote(file); }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} onSwitchVault={handleSwitchVault} />
      )}

      {showHelp && (
        <Help onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
