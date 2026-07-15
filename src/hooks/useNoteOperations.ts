import { useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import type { Tab } from "../types";
import type { createNoteSessionCoordinator } from "../services/note-session";

type SessionCoordinator = ReturnType<typeof createNoteSessionCoordinator>;

interface Dependencies {
  sessionCoordinator: SessionCoordinator;
  refreshNotes: () => Promise<string[]>;
  refreshBacklinks: (files: string[]) => Promise<void>;
  setErrorMessage: (msg: string | null) => void;
  setShowNewNoteDialog: (v: boolean) => void;
  setShowWikiCreateDialog: (v: boolean) => void;
  setWikiTarget: (v: string | null) => void;
}

function normalizeNotePath(fileName: string): string {
  return fileName.endsWith(".md") ? fileName : `${fileName}.md`;
}

function noteLabel(fileName: string): string {
  return fileName.split("/").pop()?.replace(/\.md$/, "") || fileName;
}

export function useNoteOperations({
  sessionCoordinator,
  refreshNotes,
  refreshBacklinks,
  setErrorMessage,
  setShowNewNoteDialog,
  setShowWikiCreateDialog,
  setWikiTarget,
}: Dependencies) {
  const setActiveNote = useAppStore((s) => s.setActiveNote);
  const setActiveTabId = useAppStore((s) => s.setActiveTabId);
  const setRawContent = useAppStore((s) => s.setRawContent);
  const setSaved = useAppStore((s) => s.setSaved);
  const setOpenTabs = useAppStore((s) => s.setOpenTabs);
  const setBookmarks = useAppStore((s) => s.setBookmarks);
  const setPinnedNotes = useAppStore((s) => s.setPinnedNotes);
  const setRenamingFile = useAppStore((s) => s.setRenamingFile);
  const setRenameValue = useAppStore((s) => s.setRenameValue);

  const syncTab = useCallback((fileName: string, dirty: boolean) => {
    setOpenTabs((prev: Tab[]) => {
      if (prev.some((t) => t.id === fileName)) {
        return prev.map((t) => (t.id === fileName ? { ...t, dirty } : t));
      }
      return [...prev, { id: fileName, label: noteLabel(fileName), dirty }];
    });
  }, [setOpenTabs]);

  const openNote = useCallback(async (fileName: string) => {
    const normalized = normalizeNotePath(fileName);
    setActiveNote(normalized);
    setActiveTabId(normalized);

    let session = sessionCoordinator.get(normalized);
    if (!session) {
      session = sessionCoordinator.open(normalized);
    }

    if (!session.dirty) {
      try {
        await sessionCoordinator.load(normalized);
      } catch (err) {
        if (useAppStore.getState().activeTabId !== normalized) return;
        setErrorMessage(`Failed to load note: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    }

    if (useAppStore.getState().activeTabId !== normalized) return;

    const current = sessionCoordinator.get(normalized);
    if (!current) return;

    setRawContent(current.buffer);
    setSaved(!current.dirty);
    syncTab(normalized, current.dirty);
  }, [sessionCoordinator, setActiveNote, setActiveTabId, setRawContent, setSaved, syncTab, setErrorMessage]);

  const createNote = useCallback(async (name: string) => {
    const raw = name.trim();
    const fileName = normalizeNotePath(raw);
    const result = await window.electronAPI.createNote(fileName);
    if (!result.ok) {
      setErrorMessage(`Failed to create note: ${result.error.message}`);
      return;
    }
    const actualName = result.value;
    const files = await refreshNotes();
    await refreshBacklinks(files);
    await openNote(actualName);
  }, [refreshNotes, refreshBacklinks, openNote, setErrorMessage]);

  const deleteNote = useCallback(async (fileName: string) => {
    const result = await window.electronAPI.deleteNote(fileName);
    if (!result.ok) {
      setErrorMessage(`Failed to delete note: ${result.error.message}`);
      return;
    }
    sessionCoordinator.delete(fileName);
    const store = useAppStore.getState();
    const activeNote = store.activeNote;
    const activeTabId = store.activeTabId;
    if (activeNote === fileName) {
      setActiveNote(null);
      setRawContent("");
    }
    setOpenTabs((prev: Tab[]) => prev.filter((t) => t.id !== fileName));
    if (activeTabId === fileName) setActiveTabId(null);
    setBookmarks((prev: string[]) => prev.filter((b) => b !== fileName));
    setPinnedNotes((prev: string[]) => prev.filter((p) => p !== fileName));
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [sessionCoordinator, setActiveNote, setRawContent, setOpenTabs, setActiveTabId, setBookmarks, setPinnedNotes, refreshNotes, refreshBacklinks, setErrorMessage]);

  const renameNote = useCallback(async (oldName: string, newName: string) => {
    const result = await window.electronAPI.renameNote(oldName, newName.trim());
    if (!result.ok) {
      setErrorMessage(`Failed to rename note: ${result.error.message}`);
      return;
    }
    const newPath = result.value;
    try {
      sessionCoordinator.rename(oldName, newPath);
    } catch {
      sessionCoordinator.delete(oldName);
    }
    const store = useAppStore.getState();
    if (store.activeNote === oldName) setActiveNote(newPath);
    setBookmarks((prev: string[]) => prev.map((b) => (b === oldName ? newPath : b)));
    setPinnedNotes((prev: string[]) => prev.map((p) => (p === oldName ? newPath : p)));
    setOpenTabs((prev: Tab[]) => prev.map((t) =>
      t.id === oldName ? { ...t, id: newPath, label: noteLabel(newPath) } : t
    ));
    if (store.activeTabId === oldName) setActiveTabId(newPath);
    const files = await refreshNotes();
    await refreshBacklinks(files);
  }, [sessionCoordinator, setActiveNote, setActiveTabId, setBookmarks, setPinnedNotes, setOpenTabs, refreshNotes, refreshBacklinks, setErrorMessage]);

  const createWikiNote = useCallback(async (noteName: string) => {
    const result = await window.electronAPI.createNote(noteName);
    if (!result.ok) {
      setErrorMessage(`Failed to create note: ${result.error.message}`);
      return;
    }
    const files = await refreshNotes();
    await refreshBacklinks(files);
    await openNote(noteName);
  }, [refreshNotes, refreshBacklinks, openNote, setErrorMessage]);

  const createDailyNote = useCallback(async () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const fileName = `${dateStr}.md`;
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
    const template = useAppStore.getState().dailyNoteTemplate;
    const content = template.replace(/\{\{date\}\}/g, dateStr);
    const saveResult = await window.electronAPI.saveNote(fileName, content);
    if (!saveResult.ok) {
      setErrorMessage(`Failed to apply template: ${saveResult.error.message}`);
    }
    const newFiles = await refreshNotes();
    await refreshBacklinks(newFiles);
    await openNote(fileName);
  }, [refreshNotes, refreshBacklinks, openNote, setErrorMessage]);

  const handleWikiLinkClick = useCallback(async (target: string) => {
    const fileName = normalizeNotePath(target);
    const currentNotes = useAppStore.getState().notes;
    if (currentNotes.includes(fileName)) {
      await openNote(fileName);
    } else {
      setWikiTarget(fileName);
      setShowWikiCreateDialog(true);
    }
  }, [openNote, setWikiTarget, setShowWikiCreateDialog]);

  const handleNewNote = useCallback(() => {
    setShowNewNoteDialog(true);
  }, [setShowNewNoteDialog]);

  const handleRenameNote = useCallback((oldName: string) => {
    const baseName = oldName.split("/").pop()?.replace(/\.md$/, "") || oldName;
    setRenamingFile(oldName);
    setRenameValue(baseName);
  }, [setRenamingFile, setRenameValue]);

  return {
    openNote,
    createNote,
    deleteNote,
    renameNote,
    createWikiNote,
    createDailyNote,
    handleWikiLinkClick,
    handleNewNote,
    handleRenameNote,
  };
}
