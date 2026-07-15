import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { buildBacklinks, buildTagIndex } from "../plugins/frontmatter";
import { createNoteSessionCoordinator } from "../services/note-session";

type SessionCoordinator = ReturnType<typeof createNoteSessionCoordinator>;

export function useAutosave(
  sessionCoordinator: SessionCoordinator,
  setErrorMessage: (msg: string | null) => void,
  onNoteSaved?: (path: string, content: string) => void,
) {
  const activeNote = useAppStore((s) => s.activeNote);
  const setRawContent = useAppStore((s) => s.setRawContent);
  const setSaved = useAppStore((s) => s.setSaved);
  const setAllContents = useAppStore((s) => s.setAllContents);
  const setBacklinks = useAppStore((s) => s.setBacklinks);
  const setTagIndex = useAppStore((s) => s.setTagIndex);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNoteSavedRef = useRef(onNoteSaved);
  onNoteSavedRef.current = onNoteSaved;

  const handleContentChange = useCallback((value: string) => {
    setRawContent(value);
    setSaved(false);
    if (!activeNote) return;
    if (sessionCoordinator.get(activeNote)) {
      sessionCoordinator.update(activeNote, value);
    } else {
      sessionCoordinator.open(activeNote, { buffer: value });
      sessionCoordinator.update(activeNote, value);
    }
    useAppStore.getState().setOpenTabs((prev) =>
      prev.map((t) => (t.id === activeNote ? { ...t, dirty: true } : t))
    );
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const noteId = activeNote;
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await sessionCoordinator.save(noteId);
      } catch (err) {
        setErrorMessage(`Failed to save note: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      if (useAppStore.getState().activeNote === noteId) setSaved(true);
      useAppStore.getState().setOpenTabs((prev) =>
        prev.map((t) => (t.id === noteId ? { ...t, dirty: false } : t))
      );
      const store = useAppStore.getState();
      const contents = new Map(store.allContents);
      contents.set(noteId, value);
      setAllContents(contents);
      setBacklinks(buildBacklinks(contents));
      setTagIndex(buildTagIndex(contents));
      onNoteSavedRef.current?.(noteId, value);
    }, 500);
  }, [activeNote, sessionCoordinator, setRawContent, setSaved, setAllContents, setBacklinks, setTagIndex, setErrorMessage]);

  const handleManualSave = useCallback(async () => {
    const store = useAppStore.getState();
    const note = store.activeNote;
    const content = store.rawContent;
    if (!note) return;
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
    useAppStore.getState().setOpenTabs((prev) =>
      prev.map((t) => (t.id === note ? { ...t, dirty: false } : t))
    );
    const contents = new Map(store.allContents);
    contents.set(note, content);
    setAllContents(contents);
    setBacklinks(buildBacklinks(contents));
    setTagIndex(buildTagIndex(contents));
    onNoteSavedRef.current?.(note, content);
  }, [sessionCoordinator, setSaved, setAllContents, setBacklinks, setTagIndex, setErrorMessage]);

  // Close handshake - always approve close so a failed flush cannot trap the window
  useEffect(() => {
    const cleanup = window.electronAPI.onCloseRequested(async () => {
      try {
        await sessionCoordinator.flush();
      } catch (error) {
        setErrorMessage(`Failed to save changes before closing: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        await window.electronAPI.closeReady();
      }
    });
    return cleanup;
  }, [sessionCoordinator, setErrorMessage]);

  return { handleContentChange, handleManualSave, saveTimeoutRef };
}
