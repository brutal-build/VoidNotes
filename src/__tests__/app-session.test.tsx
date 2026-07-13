// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TabBar from "../components/TabBar";
import NoteEditor from "../components/NoteEditor";

vi.mock("@uiw/react-codemirror", () => ({ default: (props: any) => <div data-testid="editor" spellCheck={props.spellCheck} /> }));

describe("renderer session correctness", () => {
  it("exposes tabs and supports arrow-key navigation", () => {
    const select = vi.fn();
    render(<TabBar tabs={[{ id: "a.md", label: "A", dirty: false }, { id: "b.md", label: "B", dirty: true }]} activeTab="a.md" onSelect={select} onClose={vi.fn()} onReorder={vi.fn()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAccessibleName(/B.*unsaved/i);
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(select).toHaveBeenCalledWith("b.md");
  });

  it("passes the spellcheck preference to the editor", () => {
    render(<NoteEditor content="" onChange={vi.fn()} noteNames={[]} spellcheck={false} />);
    expect(screen.getByTestId("editor")).toHaveAttribute("spellcheck", "false");
  });
});
