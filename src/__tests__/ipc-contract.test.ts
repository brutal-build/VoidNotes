import { describe, expect, it } from "vitest";
import { err, isIpcResult, ok } from "../shared/ipc-contract";

describe("IPC contract", () => {
  it("creates a success result", () => {
    expect(ok({ path: "note.md" })).toEqual({ ok: true, value: { path: "note.md" } });
  });

  it("creates a structured error result", () => {
    expect(err("NOT_FOUND", "Note not found", true)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "Note not found", retryable: true },
    });
  });

  it("rejects malformed result payloads", () => {
    expect(isIpcResult({ ok: true, value: "text" })).toBe(true);
    expect(isIpcResult({ ok: false, error: { code: "IO_ERROR", message: "Failed", retryable: true } })).toBe(true);
    expect(isIpcResult({ ok: false })).toBe(false);
    expect(isIpcResult(null)).toBe(false);
  });
});
