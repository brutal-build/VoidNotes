// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../components/Sidebar";

const defaultProps = {
  notes: ["note1.md", "note2.md", "folder/note3.md"],
  allNotes: ["note1.md", "note2.md", "folder/note3.md"],
  activeNote: null as string | null,
  focusMode: false,
  vaultPath: "C:/test-vault",
  tags: ["tag1", "tag2"],
  selectedTags: [],
  bookmarks: [] as string[],
  pinnedNotes: [] as string[],
  onToggleTag: vi.fn(),
  onToggleFocusMode: vi.fn(),
  onSelect: vi.fn(),
  onNew: vi.fn(),
  onDelete: vi.fn(),
  onRename: vi.fn(),
  onToggleBookmark: vi.fn(),
  onTogglePin: vi.fn(),
  onDailyNote: vi.fn(),
  onOpenSearch: vi.fn(),
  onOpenSettings: vi.fn(),
  onOpenHelp: vi.fn(),
};

describe("Sidebar", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("renders file tree from notes", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("note1")).toBeDefined();
    expect(screen.getByText("note2")).toBeDefined();
    expect(screen.getByText("folder")).toBeDefined();
  });

  it("shows empty state when no notes", () => {
    render(<Sidebar {...defaultProps} notes={[]} allNotes={[]} />);
    expect(screen.getByText("No notes yet")).toBeDefined();
    expect(screen.getByText("Press Ctrl+N to create your first note.")).toBeDefined();
    expect(screen.getByText("Create Note")).toBeDefined();
  });

  it("calls onNew when empty state action clicked", () => {
    const onNew = vi.fn();
    render(<Sidebar {...defaultProps} notes={[]} allNotes={[]} onNew={onNew} />);
    fireEvent.click(screen.getByText("Create Note"));
    expect(onNew).toHaveBeenCalledOnce();
  });

  it("expands folder when clicked", () => {
    render(<Sidebar {...defaultProps} />);
    const folderHeader = screen.getByText("folder");
    expect(screen.queryByText("note3")).toBeNull();
    fireEvent.click(folderHeader);
    expect(screen.getByText("note3")).toBeDefined();
  });

  it("shows active note with aria-selected", () => {
    render(<Sidebar {...defaultProps} activeNote="note1.md" />);
    const fileItems = document.querySelectorAll('[role="treeitem"][aria-selected="true"]');
    expect(fileItems.length).toBeGreaterThan(0);
    expect(fileItems[0].textContent).toContain("note1");
  });

  it("renders bookmarked notes with star", () => {
    render(<Sidebar {...defaultProps} bookmarks={["note1.md"]} />);
    const star = document.querySelector('.tree-file [title="Bookmarked"]');
    expect(star).toBeDefined();
  });

  it("opens folder via keyboard right arrow", () => {
    render(<Sidebar {...defaultProps} />);
    const tree = screen.getByRole("tree");
    fireEvent.focus(tree);
    const folderItems = document.querySelectorAll('.tree-folder-header');
    expect(folderItems.length).toBeGreaterThan(0);
    fireEvent.click(folderItems[0]);
    fireEvent.keyDown(tree, { key: "ArrowRight" });
    expect(screen.getByText("note3")).toBeDefined();
  });
});
