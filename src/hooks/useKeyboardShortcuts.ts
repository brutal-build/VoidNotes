import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";

interface ShortcutDeps {
  togglePreview: () => void;
  toggleSplitView: () => void;
  handleManualSave: () => Promise<void>;
  handleNewNote: () => void;
  handleDailyNote: () => Promise<void>;
}

export function useKeyboardShortcuts(deps: ShortcutDeps) {
  const setShowSearch = useAppStore((s) => s.setShowSearch);
  const setShowGlobalSearch = useAppStore((s) => s.setShowGlobalSearch);
  const setShowTemplates = useAppStore((s) => s.setShowTemplates);
  const setShowSettings = useAppStore((s) => s.setShowSettings);
  const setShowHelp = useAppStore((s) => s.setShowHelp);
  const setFocusMode = useAppStore((s) => s.setFocusMode);
  const focusMode = useAppStore((s) => s.focusMode);

  const depsRef = useRef(deps);
  depsRef.current = deps;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const inEditor = active?.closest(".cm-editor") !== null;

      if (e.ctrlKey && e.key === "e") { e.preventDefault(); depsRef.current.togglePreview(); }
      if (e.ctrlKey && e.shiftKey && e.key === "E") { e.preventDefault(); depsRef.current.toggleSplitView(); }
      if (e.ctrlKey && e.key === "p") { if (!inEditor) { e.preventDefault(); setShowSearch((v: boolean) => !v); } }
      if (e.ctrlKey && e.shiftKey && e.key === "F") { e.preventDefault(); setShowGlobalSearch((v: boolean) => !v); }
      if (e.ctrlKey && e.key === "t") { if (!inEditor) { e.preventDefault(); setShowTemplates((v: boolean) => !v); } }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); depsRef.current.handleManualSave(); }
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); depsRef.current.handleNewNote(); }
      if (e.ctrlKey && e.shiftKey && e.key === "N") { e.preventDefault(); depsRef.current.handleDailyNote(); }
      if (e.ctrlKey && e.key === "d") { if (!inEditor) { e.preventDefault(); depsRef.current.handleDailyNote(); } }
      if (e.ctrlKey && e.key === ",") { e.preventDefault(); setShowSettings((v: boolean) => !v); }
      if (e.key === "F1") { e.preventDefault(); setShowHelp((v: boolean) => !v); }
      if (e.key === "F9") { e.preventDefault(); setFocusMode((v: boolean) => !v); }

      // Escape to exit focus mode (only when focus mode is active and no modal is open)
      if (e.key === "Escape" && useAppStore.getState().focusMode) {
        const store = useAppStore.getState();
        const hasModal = store.showSettings || store.showHelp || store.showSearch || store.showGlobalSearch || store.showGraph || store.showTemplates || store.showBookmarks || store.showCanvas;
        if (!hasModal) {
          e.preventDefault();
          setFocusMode(false);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setShowSearch, setShowGlobalSearch, setShowTemplates, setShowSettings, setShowHelp, setFocusMode, focusMode]);
}
