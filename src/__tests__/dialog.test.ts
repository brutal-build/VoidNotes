// @vitest-environment jsdom
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "../components/ui/Dialog";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ToastRegion } from "../components/ui/ToastRegion";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

function render(element: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(element));
  return host;
}

function key(keyName: string, shiftKey = false) {
  act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: keyName, shiftKey, bubbles: true })));
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
  document.body.innerHTML = "";
});

describe("Dialog", () => {
  it("labels a modal dialog and moves focus inside", () => {
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    const view = render(React.createElement(Dialog, { open: true, title: "Save note", onEscape: vi.fn(), onBackdrop: vi.fn() },
      React.createElement("button", null, "First")));
    const dialog = view.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(view.querySelector(`#${dialog.getAttribute("aria-labelledby")}`)?.textContent).toBe("Save note");
    expect(document.activeElement?.textContent).toBe("First");
  });

  it("traps forward and backward tab focus", () => {
    const view = render(React.createElement(Dialog, { open: true, title: "Actions" },
      React.createElement("button", null, "First"), React.createElement("button", null, "Last")));
    const buttons = view.querySelectorAll("button");
    (buttons[1] as HTMLElement).focus();
    key("Tab");
    expect(document.activeElement).toBe(buttons[0]);
    key("Tab", true);
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("calls close hooks and restores focus when closed", () => {
    const escape = vi.fn();
    const backdrop = vi.fn();
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    const view = render(React.createElement(Dialog, { open: true, title: "Close", onEscape: escape, onBackdrop: backdrop }, React.createElement("button", null, "Inside")));
    key("Escape");
    expect(escape).toHaveBeenCalledOnce();
    const overlay = view.firstElementChild as HTMLElement;
    act(() => overlay.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(backdrop).toHaveBeenCalledOnce();
    act(() => root!.render(React.createElement(Dialog, { open: false, title: "Close" })));
    expect(document.activeElement).toBe(opener);
  });
});

describe("ConfirmDialog", () => {
  it("offers Save, Discard, Cancel and marks destructive confirmation", () => {
    const save = vi.fn(); const discard = vi.fn(); const cancel = vi.fn();
    const view = render(React.createElement(ConfirmDialog, { open: true, title: "Unsaved", message: "Choose", variant: "save-discard", onConfirm: save, onDiscard: discard, onCancel: cancel }));
    expect(Array.from(view.querySelectorAll("button"), button => button.textContent)).toEqual(["Save", "Discard", "Cancel"]);
    act(() => (view.querySelectorAll("button")[1] as HTMLButtonElement).click());
    expect(discard).toHaveBeenCalledOnce();
    act(() => root!.render(React.createElement(ConfirmDialog, { open: true, title: "Delete", message: "Forever", variant: "destructive", confirmLabel: "Delete", onConfirm: save, onCancel: cancel })));
    expect(view.querySelector('[data-variant="destructive"]')?.textContent).toBe("Delete");
  });
});

describe("ToastRegion", () => {
  it("announces status messages in a live region", () => {
    const view = render(React.createElement(ToastRegion, { messages: [{ id: "1", message: "Saved" }] }));
    const region = view.querySelector('[role="status"]');
    expect(region?.getAttribute("aria-live")).toBe("polite");
    expect(region?.getAttribute("aria-atomic")).toBe("true");
    expect(region?.textContent).toContain("Saved");
  });
});
