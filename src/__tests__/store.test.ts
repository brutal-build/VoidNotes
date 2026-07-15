import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAppStore } from "../store/useAppStore";

// Mock localStorage for Node environment
const store: Record<string, string> = {};
beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  });
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      notes: [],
      activeNote: null,
      rawContent: "",
      previewMode: false,
      openTabs: [],
      activeTabId: null,
      selectedTags: [],
      bookmarks: [],
      showSearch: false,
      showSettings: false,
      vaultPath: null,
      vaultReady: false,
    });
  });

  it("toggles tag correctly", () => {
    const { toggleTag } = useAppStore.getState();
    toggleTag("javascript");
    expect(useAppStore.getState().selectedTags).toEqual(["javascript"]);
    toggleTag("javascript");
    expect(useAppStore.getState().selectedTags).toEqual([]);
  });

  it("toggles bookmark correctly", () => {
    const { toggleBookmark } = useAppStore.getState();
    toggleBookmark("note-a.md");
    expect(useAppStore.getState().bookmarks).toEqual(["note-a.md"]);
    toggleBookmark("note-a.md");
    expect(useAppStore.getState().bookmarks).toEqual([]);
  });

  it("sets notes", () => {
    useAppStore.getState().setNotes(["a.md", "b.md"]);
    expect(useAppStore.getState().notes).toEqual(["a.md", "b.md"]);
  });

  it("accepts updater functions", () => {
    useAppStore.getState().setOpenTabs([{ id: "a", label: "A", dirty: false }]);
    useAppStore.getState().setOpenTabs((prev) => [...prev, { id: "b", label: "B", dirty: true }]);
    expect(useAppStore.getState().openTabs).toHaveLength(2);
  });

  it("accepts boolean toggles via updater", () => {
    expect(useAppStore.getState().showSearch).toBe(false);
    useAppStore.getState().setShowSearch((v) => !v);
    expect(useAppStore.getState().showSearch).toBe(true);
    useAppStore.getState().setShowSearch((v) => !v);
    expect(useAppStore.getState().showSearch).toBe(false);
  });

  it("persists theme to localStorage", () => {
    useAppStore.getState().setTheme("macos");
    expect(useAppStore.getState().theme).toBe("macos");
    expect(localStorage.getItem("void-notes-theme")).toBe("macos");
  });
});
