// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TabBar from "../components/TabBar";
import type { Tab } from "../types";

const makeTabs = (): Tab[] => [
  { id: "note1.md", label: "Note 1", dirty: false },
  { id: "note2.md", label: "Note 2", dirty: true },
  { id: "note3.md", label: "Note 3", dirty: false },
];

describe("TabBar", () => {
  it("renders tabs from props", () => {
    const tabs = makeTabs();
    render(
      <TabBar
        tabs={tabs}
        activeTab="note1.md"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByText("Note 1")).toBeDefined();
    expect(screen.getByText("Note 2")).toBeDefined();
    expect(screen.getByText("Note 3")).toBeDefined();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("calls onSelect when a tab is clicked", () => {
    const onSelect = vi.fn();
    const tabs = makeTabs();
    render(
      <TabBar
        tabs={tabs}
        activeTab="note1.md"
        onSelect={onSelect}
        onClose={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Note 2"));
    expect(onSelect).toHaveBeenCalledWith("note2.md");
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    const tabs = makeTabs();
    render(
      <TabBar
        tabs={tabs}
        activeTab="note1.md"
        onSelect={vi.fn()}
        onClose={onClose}
        onReorder={vi.fn()}
      />
    );
    const closeButtons = screen.getAllByTitle("Close tab");
    fireEvent.click(closeButtons[1]); // close Note 2
    expect(onClose).toHaveBeenCalledWith("note2.md");
  });

  it("shows active tab with aria-selected", () => {
    const tabs = makeTabs();
    render(
      <TabBar
        tabs={tabs}
        activeTab="note2.md"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    const tabElements = screen.getAllByRole("tab");
    expect(tabElements[0].getAttribute("aria-selected")).toBe("false");
    expect(tabElements[1].getAttribute("aria-selected")).toBe("true");
    expect(tabElements[2].getAttribute("aria-selected")).toBe("false");
  });

  it("shows dirty indicator on unsaved tabs", () => {
    const tabs = makeTabs();
    render(
      <TabBar
        tabs={tabs}
        activeTab="note1.md"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    // Note 2 (index 1) has dirty: true, should have a dirty dot
    const tabElements = screen.getAllByRole("tab");
    expect(tabElements[1].querySelector(".tab-dirty")).toBeDefined();
  });

  it("renders empty tablist when no tabs", () => {
    render(
      <TabBar
        tabs={[]}
        activeTab={null}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    const tablist = screen.getByRole("tablist");
    expect(tablist.children).toHaveLength(0);
  });

  it("renders tab labels correctly", () => {
    const tabs = [
      { id: "folder/sub.md", label: "sub", dirty: false },
    ];
    render(
      <TabBar
        tabs={tabs}
        activeTab="folder/sub.md"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByText("sub")).toBeDefined();
  });
});
