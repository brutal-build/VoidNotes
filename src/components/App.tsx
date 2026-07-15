import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Sidebar from "./Sidebar";
import CommandPalette from "./CommandPalette";
import VaultSetup from "./VaultSetup";
import ResizablePanel from "./ResizablePanel";
import LeftRibbon from "./LeftRibbon";
import UpdateDialog from "./UpdateDialog";
import RenameModal from "./RenameModal";
import SettingsWrapper from "./SettingsWrapper";
import AppOverlays from "./AppOverlays";
import EditorArea from "./EditorArea";
import LazyPanel from "./LazyPanel";
import { useAppStore, useFilteredNotes, useSortedTags, useNoteBacklinks } from "../store/useAppStore";
import { createNoteSessionCoordinator, nearestNeighborAfterClose } from "../services/note-session";
import { createVaultIndex, updateVaultIndex, removeFromVaultIndex } from "../services/vault-index";
import { buildBacklinks } from "../plugins/frontmatter";
import { useModalState } from "../hooks/useModalState";
import { useTheme } from "../hooks/useTheme";
import { useVaultSync } from "../hooks/useVaultSync";
import { useNoteOperations } from "../hooks/useNoteOperations";
import { useAutosave } from "../hooks/useAutosave";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useSplitView } from "../hooks/useSplitView";
import { useUpdateFlow } from "../hooks/useUpdateFlow";
import { useToast } from "../hooks/useToast";
import type { Tab, ActivePanel } from "../types";

// Lazy-loaded
const Help = React.lazy(() => import("./Help"));
const GraphView = React.lazy(() => import("./GraphView"));
const GlobalSearch = React.lazy(() => import("./GlobalSearch"));
const TemplatesPanel = React.lazy(() => import("./TemplatesPanel"));
const BookmarksPanel = React.lazy(() => import("./BookmarksPanel"));
const CanvasView = React.lazy(() => import("./CanvasView"));
const TrashPanel = React.lazy(() => import("./TrashPanel"));
const VaultStats = React.lazy(() => import("./VaultStats"));

export default function App() {
  // ─── Store selectors ────────────────────────────────────
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
  const autoUpdate = useAppStore((s) => s.autoUpdate);
  const dailyNoteTemplate = useAppStore((s) => s.dailyNoteTemplate);
  const pinnedNotes = useAppStore((s) => s.pinnedNotes);

  // Derived
  const filteredNotes = useFilteredNotes();
  const sortedTags = useSortedTags();
  const noteBacklinks = useNoteBacklinks();

  // Incremental vault index (ref + version counter for re-renders)
  const vaultIndexRef = useRef(createVaultIndex());
  const [vaultIndexVersion, setVaultIndexVersion] = useState(0);

  // Incremental index update callback
  const handleNoteSaved = useCallback((path: string, content: string) => {
    updateVaultIndex(vaultIndexRef.current, path, content);
    setVaultIndexVersion((v) => v + 1);
  }, []);

  const rebuildFullIndex = useCallback(() => {
    const state = useAppStore.getState();
    const entries = state.notes.map((path) => ({
      path,
      content: state.allContents.get(path) ?? "",
    }));
    vaultIndexRef.current = createVaultIndex(entries);
    setVaultIndexVersion((v) => v + 1);
  }, []);

  // ─── Store setters ─────────────────────────────────────
  const setPreviewMode = useAppStore((s) => s.setPreviewMode);
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
  const setVimMode = useAppStore((s) => s.setVimMode);
  const setReadableLineLength = useAppStore((s) => s.setReadableLineLength);
  const setEditorFont = useAppStore((s) => s.setEditorFont);
  const setSpellcheck = useAppStore((s) => s.setSpellcheck);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const toggleTag = useAppStore((s) => s.toggleTag);
  const setRenamingFile = useAppStore((s) => s.setRenamingFile);
  const setRenameValue = useAppStore((s) => s.setRenameValue);
  const setAutoUpdate = useAppStore((s) => s.setAutoUpdate);
  const setRawContent = useAppStore((s) => s.setRawContent);
  const setDailyNoteTemplate = useAppStore((s) => s.setDailyNoteTemplate);
  const togglePin = useAppStore((s) => s.togglePin);
  const [showVaultStats, setShowVaultStats] = useState(false);

  // ═══ Hooks ═══════════════════════════════════════════════

  const modal = useModalState();

  const { theme, setTheme } = useTheme();

  const { refreshNotes, refreshBacklinks, handleVaultSelect, handleSwitchVault } =
    useVaultSync(modal.setErrorMessage);

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

  const noteOps = useNoteOperations({
    sessionCoordinator,
    refreshNotes,
    refreshBacklinks,
    setErrorMessage: modal.setErrorMessage,
    setShowNewNoteDialog: modal.setShowNewNoteDialog,
    setShowWikiCreateDialog: modal.setShowWikiCreateDialog,
    setWikiTarget: modal.setWikiTarget,
  });

  const { handleContentChange, handleManualSave } = useAutosave(
    sessionCoordinator,
    modal.setErrorMessage,
    handleNoteSaved,
  );

  const splitView = useSplitView();

  const togglePreview = useCallback(
    () => setPreviewMode(!useAppStore.getState().previewMode),
    [setPreviewMode],
  );

  useKeyboardShortcuts({
    togglePreview,
    toggleSplitView: splitView.toggleSplitView,
    handleManualSave,
    handleNewNote: noteOps.handleNewNote,
    handleDailyNote: noteOps.createDailyNote,
  });

  const updateFlow = useUpdateFlow();
  const { toasts, showToast, dismissToast } = useToast();

  // Show error toasts when errorMessage is set
  useEffect(() => {
    if (modal.errorMessage) {
      showToast("error", modal.errorMessage);
    }
  }, [modal.errorMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Initial vault load ──────────────────────────────────
  useEffect(() => {
    if (!vaultReady) return;
    refreshNotes().then((files) => {
      refreshBacklinks(files);
      if (files.length > 0) noteOps.openNote(files[0]);
    });
  }, [vaultReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the full vault index on initial load
  useEffect(() => {
    if (!vaultReady) return;
    rebuildFullIndex();
  }, [vaultReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild index when notes count changes (structural changes: add/remove)
  useEffect(() => {
    if (!vaultReady) return;
    if (vaultIndexRef.current.size !== notes.length) {
      rebuildFullIndex();
    }
  }, [notes.length, vaultReady, rebuildFullIndex]);

  // ─── Tab management ─────────────────────────────────────
  const handleTabSelect = useCallback(
    (id: string) => { noteOps.openNote(id); },
    [noteOps.openNote],
  );

  const closeTab = useCallback((id: string) => {
    const currentTabs = useAppStore.getState().openTabs;
    const remaining = currentTabs.filter((t) => t.id !== id);
    const setOpenTabs = useAppStore.getState().setOpenTabs;
    setOpenTabs(remaining);
    const currentActiveTabId = useAppStore.getState().activeTabId;
    if (currentActiveTabId === id) {
      const nextTab = nearestNeighborAfterClose(currentTabs.map((t) => t.id), id);
      if (nextTab) noteOps.openNote(nextTab);
      else {
        useAppStore.getState().setActiveNote(null);
        useAppStore.getState().setRawContent("");
        useAppStore.getState().setActiveTabId(null);
      }
    }
  }, [noteOps.openNote]);

  const handleTabClose = useCallback((id: string) => {
    const session = sessionCoordinator.get(id);
    if (session?.dirty) {
      modal.setClosingTabId(id);
      modal.setShowCloseConfirmDialog(true);
      return;
    }
    closeTab(id);
  }, [sessionCoordinator, closeTab, modal]);

  const handleSaveAndClose = useCallback(async () => {
    if (!modal.closingTabId) return;
    try {
      await sessionCoordinator.save(modal.closingTabId);
      closeTab(modal.closingTabId);
    } catch (err) {
      modal.setErrorMessage(`Failed to save note: ${err instanceof Error ? err.message : String(err)}`);
    }
    modal.setShowCloseConfirmDialog(false);
    modal.setClosingTabId(null);
  }, [modal.closingTabId, sessionCoordinator, closeTab, modal]);

  const handleDiscardAndClose = useCallback(() => {
    if (!modal.closingTabId) return;
    sessionCoordinator.delete(modal.closingTabId);
    closeTab(modal.closingTabId);
    modal.setShowCloseConfirmDialog(false);
    modal.setClosingTabId(null);
  }, [modal.closingTabId, sessionCoordinator, closeTab, modal]);

  const handleCancelClose = useCallback(() => {
    modal.setShowCloseConfirmDialog(false);
    modal.setClosingTabId(null);
  }, [modal]);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    const setOpenTabs = useAppStore.getState().setOpenTabs;
    setOpenTabs((prev: Tab[]) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // ─── New folder handler ─────────────────────────────────
  const handleNewFolder = useCallback(() => {
    modal.setShowNewFolderDialog(true);
  }, [modal]);

  const confirmNewFolder = useCallback(async (folderName: string) => {
    modal.setShowNewFolderDialog(false);
    const result = await window.electronAPI.createFolder(folderName);
    if (!result.ok) {
      modal.setErrorMessage(`Failed to create folder: ${result.error.message}`);
      return;
    }
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [refreshNotes, refreshBacklinks, modal]);

  // ─── Delete with confirmation ───────────────────────────
  const handleDeleteNote = useCallback((fileName: string) => {
    modal.setDeletingFile(fileName);
    modal.setShowDeleteConfirmDialog(true);
  }, [modal]);

  const confirmDelete = useCallback(async () => {
    if (!modal.deletingFile) return;
    const fileName = modal.deletingFile;
    modal.setShowDeleteConfirmDialog(false);
    modal.setDeletingFile(null);
    removeFromVaultIndex(vaultIndexRef.current, fileName);
    setVaultIndexVersion((v) => v + 1);
    await noteOps.deleteNote(fileName);
  }, [modal, noteOps]);

  const cancelDelete = useCallback(() => {
    modal.setShowDeleteConfirmDialog(false);
    modal.setDeletingFile(null);
  }, [modal]);

  // ─── Rename confirmation ────────────────────────────────
  const confirmRename = useCallback(async () => {
    if (!renamingFile || !renameValue.trim()) return;
    await noteOps.renameNote(renamingFile, renameValue.trim());
    setRenamingFile(null);
    setRenameValue("");
  }, [renamingFile, renameValue, noteOps, setRenamingFile, setRenameValue]);

  // ─── Wiki create confirmation ───────────────────────────
  const confirmWikiCreate = useCallback(async (noteName: string) => {
    modal.setShowWikiCreateDialog(false);
    modal.setWikiTarget(null);
    await noteOps.createWikiNote(noteName);
  }, [modal, noteOps]);

  const cancelWikiCreate = useCallback(() => {
    modal.setShowWikiCreateDialog(false);
    modal.setWikiTarget(null);
  }, [modal]);

  // ─── Template insert ────────────────────────────────────
  const handleInsertTemplate = useCallback((content: string) => {
    setRawContent(content);
    handleContentChange(content);
  }, [setRawContent, handleContentChange]);

  // ─── Export handlers ─────────────────────────────────────
  const handleExportNote = useCallback(async () => {
    if (!activeNote) return;
    const result = await window.electronAPI.exportNote(activeNote);
    if (!result.ok) showToast("error", `Export failed: ${result.error.message}`);
    else showToast("info", `Exported to ${result.value}`);
  }, [activeNote, showToast]);

  const handleExportVaultZip = useCallback(async () => {
    const result = await window.electronAPI.exportVaultZip();
    if (!result.ok) showToast("error", `Export failed: ${result.error.message}`);
    else showToast("info", `Exported to ${result.value}`);
  }, [showToast]);

  const handleExportNoteHtml = useCallback(async () => {
    if (!activeNote) return;
    const result = await window.electronAPI.exportNoteHtml(activeNote);
    if (!result.ok) showToast("error", `Export failed: ${result.error.message}`);
    else showToast("info", `Exported to ${result.value}`);
  }, [activeNote, showToast]);

  // ─── Active panel ───────────────────────────────────────
  const activePanel: ActivePanel = showGraph ? "graph"
    : showTemplates ? "templates"
    : showBookmarks ? "bookmarks"
    : showCanvas ? "canvas"
    : null;

  // ─── External watcher integration ────────────────────────
  useEffect(() => {
    if (!vaultReady) return;

    const unsubscribe = window.electronAPI.onExternalChange?.((change) => {
      const state = useAppStore.getState();
      const openTabIds = state.openTabs.map((t) => t.id);
      const isOpen = openTabIds.includes(change.path);

      if (change.type === "deleted") {
        if (isOpen) {
          showToast("warning", `"${change.path.split("/").pop()}" was deleted externally.`);
        }
        refreshNotes().then((files) => refreshBacklinks(files));
        return;
      }

      if (!isOpen) {
        // Reload content silently
        refreshNotes().then((files) => refreshBacklinks(files));
        return;
      }

      // Note is open
      const session = sessionCoordinator.get(change.path);
      if (session?.dirty) {
        showToast("warning", `File "${change.path.split("/").pop()}" changed externally. Your unsaved changes take priority. Save or discard to see the external version.`);
      } else {
        // Reload content
        window.electronAPI.loadNote(change.path).then((result) => {
          if (result.ok) {
            if (state.activeNote === change.path) {
              setRawContent(result.value);
            }
            sessionCoordinator.open(change.path, { buffer: result.value });
            // Update allContents
            const contents = new Map(useAppStore.getState().allContents);
            contents.set(change.path, result.value);
            useAppStore.getState().setAllContents(contents);
            useAppStore.getState().setBacklinks(buildBacklinks(contents));
          }
        });
        showToast("info", `Note "${change.path.split("/").pop()}" updated from external change.`);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [vaultReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Image paste/drop handler ────────────────────────────
  const handleImagePaste = useCallback(async (file: File): Promise<string | null> => {
    try {
      // Derive extension from the MIME type (file.type), not from file.name
      // Clipboard images often have empty or unreliable names
      const mimeExt: Record<string, string> = {
        "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif",
        "image/webp": "webp", "image/svg+xml": "svg", "image/bmp": "bmp",
      };
      const ext = mimeExt[file.type] ?? "png";
      const timestamp = Date.now();
      const fileName = `past-image-${timestamp}.${ext}`;
      const relativePath = `attachments/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const data = Array.from(new Uint8Array(arrayBuffer));

      const result = await window.electronAPI.writeFile(relativePath, data);
      if (!result.ok) {
        showToast("error", `Failed to save image: ${result.error.message}`);
        return null;
      }
      return relativePath;
    } catch (err) {
      showToast("error", `Failed to process image: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }, [showToast]);

  // ─── Render ──────────────────────────────────────────────

  if (!vaultReady) return <VaultSetup onVaultSelect={handleVaultSelect} />;

  return (
    <div className={`app theme-transition${focusMode ? " focus-mode" : ""}`}>
      {!focusMode && (
        <LeftRibbon onNewNote={noteOps.handleNewNote} onNewFolder={handleNewFolder} onOpenGraph={() => setShowGraph(!showGraph)} onDailyNote={noteOps.createDailyNote} onOpenTemplates={() => setShowTemplates((v: boolean) => !v)} onOpenBookmarks={() => setShowBookmarks((v: boolean) => !v)} onOpenCanvas={() => setShowCanvas((v: boolean) => !v)} onOpenTrash={() => modal.setShowTrash((v: boolean) => !v)} onOpenSettings={() => setShowSettings((v: boolean) => !v)} onOpenSearch={() => setShowSearch((v: boolean) => !v)} activePanel={activePanel} />
      )}
      {!focusMode && (
        <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400} storageKey="void-sidebar-width">
          <Sidebar notes={filteredNotes} allNotes={notes} activeNote={activeNote} focusMode={focusMode} vaultPath={vaultPath} tags={sortedTags} selectedTags={selectedTags} bookmarks={bookmarks} pinnedNotes={pinnedNotes} onToggleTag={toggleTag} onToggleFocusMode={() => setFocusMode((v: boolean) => !v)} onSelect={noteOps.openNote} onNew={noteOps.handleNewNote} onDelete={handleDeleteNote} onRename={noteOps.handleRenameNote} onToggleBookmark={toggleBookmark} onTogglePin={togglePin} onDailyNote={noteOps.createDailyNote} onOpenSearch={() => setShowSearch((v: boolean) => !v)} onOpenHelp={() => setShowHelp((v: boolean) => !v)} />
        </ResizablePanel>
      )}
      <EditorArea
        focusMode={focusMode}
        openTabs={openTabs}
        activeTabId={activeTabId}
        activeNote={activeNote}
        rawContent={rawContent}
        previewMode={previewMode}
        saved={saved}
        notes={notes}
        vimMode={vimMode}
        readableLineLength={readableLineLength}
        editorFont={editorFont}
        showRightPanel={showRightPanel}
        activePanelTab={activePanelTab}
        splitView={splitView}
        noteBacklinks={noteBacklinks}
        sortedTags={sortedTags}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onTabReorder={handleTabReorder}
        onContentChange={handleContentChange}
        onPreviewToggle={togglePreview}
        onRightPanelToggle={() => setShowRightPanel((v: boolean) => !v)}
        onFocusModeExit={() => setFocusMode(false)}
        onActivePanelTabChange={setActivePanelTab}
        onNavigate={noteOps.handleWikiLinkClick}
        onImagePaste={handleImagePaste}
        spellcheck={spellcheckStore}
      />
      {showSearch && <CommandPalette notes={notes} onSelect={(file: string) => { setShowSearch(false); noteOps.openNote(file); }} onClose={() => setShowSearch(false)} />}
      {showSettings && (
        <SettingsWrapper
          onClose={() => setShowSettings(false)}
          onSwitchVault={async () => {
            const files = await handleSwitchVault();
            rebuildFullIndex();
            if (files && files.length > 0) noteOps.openNote(files[0]);
          }}
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
          autoUpdate={autoUpdate}
          onAutoUpdateChange={setAutoUpdate}
          dailyNoteTemplate={dailyNoteTemplate}
          onDailyNoteTemplateChange={setDailyNoteTemplate}
          activeNote={activeNote}
          onExportNote={handleExportNote}
          onExportVaultZip={handleExportVaultZip}
          onExportNoteHtml={handleExportNoteHtml}
          onOpenVaultStats={() => { setShowSettings(false); setShowVaultStats(true); }}
        />
      )}
      {showHelp && <LazyPanel name="Help" component={Help} componentProps={{ onClose: () => setShowHelp(false) }} />}
      {showGraph && (
        <LazyPanel name="GraphView" component={GraphView} componentProps={{ notes, allContents, backlinks: backlinksStore, activeNote, onNodeClick: (note: string) => { setShowGraph(false); noteOps.openNote(note); }, onClose: () => setShowGraph(false) }} />
      )}
      {showGlobalSearch && (
        <LazyPanel name="GlobalSearch" component={GlobalSearch} componentProps={{ notes, contents: allContents, vaultIndex: vaultIndexRef.current, onSelect: (note: string) => { setShowGlobalSearch(false); noteOps.openNote(note); }, onClose: () => setShowGlobalSearch(false) }} />
      )}
      {showTemplates && (
        <LazyPanel name="Templates" component={TemplatesPanel} componentProps={{ onInsertTemplate: handleInsertTemplate, onClose: () => setShowTemplates(false) }} />
      )}
      {showBookmarks && (
        <LazyPanel name="Bookmarks" component={BookmarksPanel} componentProps={{ bookmarks, activeNote, onToggleBookmark: toggleBookmark, onSelect: (note: string) => { setShowBookmarks(false); noteOps.openNote(note); }, onClose: () => setShowBookmarks(false) }} />
      )}
      {showCanvas && (
        <LazyPanel name="Canvas" component={CanvasView} componentProps={{ vaultPath, onClose: () => setShowCanvas(false) }} />
      )}
      {modal.showTrash && (
        <LazyPanel name="Trash" component={TrashPanel} componentProps={{ onClose: () => modal.setShowTrash(false), onRestore: async () => { const files = await refreshNotes(); await refreshBacklinks(files); rebuildFullIndex(); } }} />
      )}
      {showVaultStats && (
        <LazyPanel name="VaultStats" component={VaultStats} componentProps={{ onClose: () => setShowVaultStats(false) }} />
      )}
      {renamingFile && (
        <RenameModal
          renameValue={renameValue}
          onRenameValueChange={setRenameValue}
          onConfirm={confirmRename}
          onCancel={() => setRenamingFile(null)}
        />
      )}
      <AppOverlays
        showRename={!!renamingFile}
        renameValue={renameValue}
        onRenameValueChange={setRenameValue}
        onRenameConfirm={confirmRename}
        onRenameCancel={() => setRenamingFile(null)}
        showNewNote={modal.showNewNoteDialog}
        onCreateNote={(name) => { modal.setShowNewNoteDialog(false); noteOps.createNote(name); }}
        onCancelNewNote={() => modal.setShowNewNoteDialog(false)}
        showNewFolder={modal.showNewFolderDialog}
        onCreateFolder={confirmNewFolder}
        onCancelNewFolder={() => modal.setShowNewFolderDialog(false)}
        showWikiCreate={modal.showWikiCreateDialog}
        wikiTarget={modal.wikiTarget}
        onWikiConfirm={confirmWikiCreate}
        onWikiCancel={cancelWikiCreate}
        showCloseConfirm={modal.showCloseConfirmDialog}
        closingTabId={modal.closingTabId}
        onSaveAndClose={handleSaveAndClose}
        onDiscardAndClose={handleDiscardAndClose}
        onCancelClose={handleCancelClose}
        showDeleteConfirm={modal.showDeleteConfirmDialog}
        deletingFile={modal.deletingFile}
        onConfirmDelete={confirmDelete}
        onCancelDelete={cancelDelete}
        toasts={toasts}
        onDismissToast={dismissToast}
      />
      {updateFlow.updateInfo && (
        <UpdateDialog
          updateInfo={updateFlow.updateInfo}
          downloadProgress={updateFlow.downloadProgress}
          updateDownloaded={updateFlow.updateDownloaded}
          onUpdate={updateFlow.handleUpdateNow}
          onSkip={updateFlow.handleSkipUpdate}
          onDismiss={updateFlow.handleDismissUpdate}
        />
      )}
    </div>
  );
}
