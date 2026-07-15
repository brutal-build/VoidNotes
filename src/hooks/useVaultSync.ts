import { useCallback, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { buildBacklinks, buildTagIndex } from "../plugins/frontmatter";

export function useVaultSync(setErrorMessage: (msg: string | null) => void) {
  const setVaultPath = useAppStore((s) => s.setVaultPath);
  const setVaultReady = useAppStore((s) => s.setVaultReady);
  const setNotes = useAppStore((s) => s.setNotes);
  const setAllContents = useAppStore((s) => s.setAllContents);
  const setBacklinks = useAppStore((s) => s.setBacklinks);
  const setTagIndex = useAppStore((s) => s.setTagIndex);
  const vaultReady = useAppStore((s) => s.vaultReady);

  const refreshNotes = useCallback(async () => {
    const result = await window.electronAPI.listNotes();
    if (!result.ok) {
      setErrorMessage(`Failed to list notes: ${result.error.message}`);
      return [];
    }
    setNotes(result.value.notes);
    return result.value.notes;
  }, [setNotes, setErrorMessage]);

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

  const handleVaultSelect = useCallback(async (p: string) => {
    const result = await window.electronAPI.setVault(p);
    if (!result.ok) {
      setErrorMessage(`Failed to set vault: ${result.error.message}`);
      return;
    }
    setVaultPath(p);
    setVaultReady(true);
  }, [setVaultPath, setVaultReady, setErrorMessage]);

  const handleSwitchVault = useCallback(async () => {
    const store = useAppStore.getState();
    store.setShowSettings(false);
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
    return files;
  }, [setVaultPath, setErrorMessage, refreshNotes, refreshBacklinks]);

  useEffect(() => {
    window.electronAPI.getVault().then((result) => {
      if (result.ok && result.value) {
        setVaultPath(result.value);
        setVaultReady(true);
      }
    });
  }, [setVaultPath, setVaultReady]);

  return { refreshNotes, refreshBacklinks, handleVaultSelect, handleSwitchVault, vaultReady };
}
