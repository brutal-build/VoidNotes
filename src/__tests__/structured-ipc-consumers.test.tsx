// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VaultSetup from "../components/VaultSetup";
import GraphView from "../components/GraphView";

vi.mock("../graph/GraphCanvas", () => ({ default: () => <div data-testid="graph-canvas" /> }));

let root: Root;
let host: HTMLDivElement;

function render(element: React.ReactElement) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(element));
  return host;
}

async function flush() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  vi.unstubAllGlobals();
});

describe("structured IPC consumers", () => {
  it("passes a selected vault value to the caller", async () => {
    const onVaultSelect = vi.fn();
    vi.stubGlobal("electronAPI", { selectVault: vi.fn().mockResolvedValue({ ok: true, value: "C:/notes" }) });
    const view = render(<VaultSetup onVaultSelect={onVaultSelect} />);
    act(() => (view.querySelector("button") as HTMLButtonElement).click());
    await flush();
    expect(onVaultSelect).toHaveBeenCalledWith("C:/notes");
  });

  it("shows a vault selection error without selecting a sentinel value", async () => {
    const onVaultSelect = vi.fn();
    vi.stubGlobal("electronAPI", { selectVault: vi.fn().mockResolvedValue({ ok: false, error: { code: "IO_ERROR", message: "Folder unavailable", retryable: true } }) });
    const view = render(<VaultSetup onVaultSelect={onVaultSelect} />);
    act(() => (view.querySelector("button") as HTMLButtonElement).click());
    await flush();
    expect(onVaultSelect).not.toHaveBeenCalled();
    expect(view.textContent).toContain("Folder unavailable");
  });

  it("unwraps note content for the graph loader", async () => {
    vi.stubGlobal("electronAPI", { loadNote: vi.fn().mockResolvedValue({ ok: true, value: "[[Second]]" }) });
    const view = render(<GraphView notes={["First", "Second"]} backlinks={new Map()} activeNote={null} onNodeClick={vi.fn()} onClose={vi.fn()} />);
    await flush();
    expect(view.textContent).not.toContain("Unable to load graph");
    expect(view.textContent).toContain("2 notes");
  });

  it("shows a graph load error instead of substituting empty note content", async () => {
    vi.stubGlobal("electronAPI", { loadNote: vi.fn().mockResolvedValue({ ok: false, error: { code: "IO_ERROR", message: "Cannot read First", retryable: true } }) });
    const view = render(<GraphView notes={["First"]} backlinks={new Map()} activeNote={null} onNodeClick={vi.fn()} onClose={vi.fn()} />);
    await flush();
    expect(view.textContent).toContain("Cannot read First");
  });
});
