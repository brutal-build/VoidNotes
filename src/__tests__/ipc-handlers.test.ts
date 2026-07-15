// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers = new Map<string, (...args: any[]) => any>();
vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn((channel: string, handler: (...args: any[]) => any) => handlers.set(channel, handler)) },
  dialog: { showOpenDialog: vi.fn() },
}));
vi.mock("../../electron/window", () => ({ getMainWindow: vi.fn(), createWelcomeFile: vi.fn() }));
vi.mock("../../electron/config", () => ({ loadConfig: vi.fn(() => null), saveConfig: vi.fn() }));

import { IPC_CHANNELS, isIpcResult } from "../shared/ipc-contract";
import { registerIpcHandlers } from "../../electron/ipc-handlers";

beforeEach(() => {
  handlers.clear();
  registerIpcHandlers();
});

describe("typed IPC handlers", () => {
  it("registers every contract request channel", () => {
    const eventChannels = new Set<string>([
      IPC_CHANNELS.appCloseRequested,
      IPC_CHANNELS.noteExternalChange,
      IPC_CHANNELS.updateAvailable,
      IPC_CHANNELS.updateProgress,
      IPC_CHANNELS.updateDownloaded,
      IPC_CHANNELS.updateError,
      IPC_CHANNELS.updateNotAvailable,
    ]);
    for (const channel of Object.values(IPC_CHANNELS)) {
      if (!eventChannels.has(channel)) expect(handlers.has(channel)).toBe(true);
    }
  });

  it("returns structured NO_VAULT results for vault-dependent requests", async () => {
    const calls: Array<[string, unknown[]]> = [
      [IPC_CHANNELS.notesList, []], [IPC_CHANNELS.notesLoad, ["a.md"]],
      [IPC_CHANNELS.notesSave, ["a.md", "x"]], [IPC_CHANNELS.notesCreate, ["a"]],
      [IPC_CHANNELS.notesDelete, ["a.md"]], [IPC_CHANNELS.notesRename, ["a.md", "b"]],
      [IPC_CHANNELS.notesStat, ["a.md"]], [IPC_CHANNELS.trashList, []],
      [IPC_CHANNELS.trashRestore, ["id"]], [IPC_CHANNELS.trashDelete, ["id"]],
      [IPC_CHANNELS.folderCreate, ["folder"]], [IPC_CHANNELS.folderRename, ["folder", "new"]],
      [IPC_CHANNELS.folderDelete, ["folder"]],
      [IPC_CHANNELS.dailyNotePath, []], [IPC_CHANNELS.exportNote, ["a.md"]],
      [IPC_CHANNELS.exportVaultZip, []], [IPC_CHANNELS.exportNoteHtml, ["a.md"]],
      [IPC_CHANNELS.vaultStats, []],
    ];
    for (const [channel, args] of calls) {
      const result = await handlers.get(channel)!({}, ...args);
      expect(isIpcResult(result), channel).toBe(true);
      expect(result, channel).toMatchObject({ ok: false, error: { code: "NO_VAULT", retryable: false } });
    }
  });
});
