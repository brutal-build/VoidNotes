// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../components/App";

// Mock all lazy-loaded components
vi.mock("../components/NoteEditor", () => ({
  default: () => <div data-testid="note-editor" />,
}));
vi.mock("../components/Settings", () => ({
  default: () => <div data-testid="settings" />,
}));
vi.mock("../components/Help", () => ({
  default: () => <div data-testid="help" />,
}));
vi.mock("../components/GraphView", () => ({
  default: () => <div data-testid="graph-view" />,
}));
vi.mock("../components/GlobalSearch", () => ({
  default: () => <div data-testid="global-search" />,
}));
vi.mock("../components/TemplatesPanel", () => ({
  default: () => <div data-testid="templates-panel" />,
}));
vi.mock("../components/BookmarksPanel", () => ({
  default: () => <div data-testid="bookmarks-panel" />,
}));
vi.mock("../components/CanvasView", () => ({
  default: () => <div data-testid="canvas-view" />,
}));
vi.mock("../components/TrashPanel", () => ({
  default: () => <div data-testid="trash-panel" />,
}));
vi.mock("../components/NoteParser", () => ({
  default: () => <div data-testid="note-parser" />,
}));
vi.mock("../components/CommandPalette", () => ({
  default: () => <div data-testid="command-palette" />,
}));
vi.mock("../components/ResizablePanel", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../components/LeftRibbon", () => ({
  default: () => <div data-testid="left-ribbon" />,
}));
vi.mock("../components/StatusBar", () => ({
  default: () => <div data-testid="status-bar" />,
}));
vi.mock("../components/TrafficLights", () => ({
  default: () => <div data-testid="traffic-lights" />,
}));
vi.mock("../components/RightPanel", () => ({
  default: () => <div data-testid="right-panel" />,
}));
vi.mock("../components/UpdateDialog", () => ({
  default: () => null,
}));
vi.mock("../components/ui/InputDialog", () => ({
  InputDialog: () => null,
}));
vi.mock("../components/ui/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

// Mock electronAPI
const mockElectronAPI = {
  selectVault: vi.fn().mockResolvedValue({ ok: false, error: { code: "CANCELLED", message: "", retryable: false } }),
  getVault: vi.fn().mockResolvedValue({ ok: true, value: null }),
  listNotes: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  loadNote: vi.fn(),
  saveNote: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  renameNote: vi.fn(),
  statNote: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  deleteFolder: vi.fn(),
  listTrash: vi.fn(),
  loadTrash: vi.fn(),
  restoreTrash: vi.fn(),
  deleteTrash: vi.fn(),
  closeReady: vi.fn(),
  minimize: vi.fn(),
  maximize: vi.fn(),
  close: vi.fn(),
  setBackground: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  setVault: vi.fn(),
  checkForUpdates: vi.fn(),
  downloadUpdate: vi.fn(),
  installUpdate: vi.fn(),
  onUpdateAvailable: vi.fn().mockReturnValue(vi.fn()),
  onDownloadProgress: vi.fn().mockReturnValue(vi.fn()),
  onUpdateDownloaded: vi.fn().mockReturnValue(vi.fn()),
  onUpdateError: vi.fn().mockReturnValue(vi.fn()),
  onUpdateNotAvailable: vi.fn().mockReturnValue(vi.fn()),
  onCloseRequested: vi.fn().mockReturnValue(vi.fn()),
  onExternalChange: vi.fn().mockReturnValue(vi.fn()),
};

beforeEach(() => {
  vi.stubGlobal("electronAPI", mockElectronAPI);
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  // Clear zustand store state by resetting module
  vi.resetModules();
});

describe("App", () => {
  it("renders VaultSetup when no vault is ready", () => {
    render(<App />);
    expect(screen.getByText("Void Notes")).toBeDefined();
    expect(screen.getByText("Open Vault Folder")).toBeDefined();
  });
});
