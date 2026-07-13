import { describe, expect, it, vi } from "vitest";
import { createNoteSessionCoordinator, nearestNeighborAfterClose } from "../services/note-session";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

describe("note session coordinator", () => {
  it("keeps independent buffer, dirty, preview, and editor state per tab", () => {
    const sessions = createNoteSessionCoordinator({ load: vi.fn(), save: vi.fn() });
    sessions.open("a.md", { buffer: "A", preview: true, editorState: { cursor: 2 } });
    sessions.open("b.md", { buffer: "B" });
    sessions.update("a.md", "A changed", { cursor: 9 });

    expect(sessions.get("a.md")).toMatchObject({ buffer: "A changed", dirty: true, preview: true, editorState: { cursor: 9 } });
    expect(sessions.get("b.md")).toMatchObject({ buffer: "B", dirty: false, preview: false, editorState: null });
  });

  it("rejects a stale load result for the same tab", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const load = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const sessions = createNoteSessionCoordinator({ load, save: vi.fn() });
    sessions.open("a.md");

    const oldLoad = sessions.load("a.md");
    const newLoad = sessions.load("a.md");
    second.resolve("new");
    expect(await newLoad).toBe(true);
    first.resolve("old");
    expect(await oldLoad).toBe(false);
    expect(sessions.get("a.md")?.buffer).toBe("new");
  });

  it("does not overwrite edits made while a load is pending", async () => {
    const pending = deferred<string>();
    const sessions = createNoteSessionCoordinator({ load: () => pending.promise, save: vi.fn() });
    sessions.open("a.md");
    const loading = sessions.load("a.md");
    sessions.update("a.md", "local edit");
    pending.resolve("disk");

    expect(await loading).toBe(false);
    expect(sessions.get("a.md")).toMatchObject({ buffer: "local edit", dirty: true });
  });

  it("serializes saves per note and keeps newer edits dirty", async () => {
    const first = deferred<void>();
    const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce(undefined);
    const sessions = createNoteSessionCoordinator({ load: vi.fn(), save });
    sessions.open("a.md", { buffer: "one" });
    sessions.update("a.md", "two");
    const savingOne = sessions.save("a.md");
    sessions.update("a.md", "three");
    const savingTwo = sessions.save("a.md");

    await Promise.resolve();
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
    first.resolve();
    await Promise.all([savingOne, savingTwo]);
    expect(save.mock.calls).toEqual([["a.md", "two"], ["a.md", "three"]]);
    expect(sessions.get("a.md")?.dirty).toBe(false);
  });

  it("keeps a failed save dirty and allows retry", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("disk full")).mockResolvedValueOnce(undefined);
    const sessions = createNoteSessionCoordinator({ load: vi.fn(), save });
    sessions.open("a.md");
    sessions.update("a.md", "content");

    await expect(sessions.save("a.md")).rejects.toThrow("disk full");
    expect(sessions.get("a.md")?.dirty).toBe(true);
    await sessions.save("a.md");
    expect(sessions.get("a.md")?.dirty).toBe(false);
  });

  it("flushes all dirty sessions", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const sessions = createNoteSessionCoordinator({ load: vi.fn(), save });
    sessions.open("a.md"); sessions.open("b.md"); sessions.open("clean.md");
    sessions.update("a.md", "A"); sessions.update("b.md", "B");
    await sessions.flush();
    expect(save.mock.calls).toEqual(expect.arrayContaining([["a.md", "A"], ["b.md", "B"]]));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("renames and deletes sessions without losing state", () => {
    const sessions = createNoteSessionCoordinator({ load: vi.fn(), save: vi.fn() });
    sessions.open("old.md", { buffer: "text", preview: true, editorState: { cursor: 4 } });
    sessions.update("old.md", "changed", { cursor: 7 });
    expect(sessions.rename("old.md", "new.md")?.id).toBe("new.md");
    expect(sessions.get("new.md")).toMatchObject({ buffer: "changed", dirty: true, preview: true, editorState: { cursor: 7 } });
    expect(sessions.get("old.md")).toBeUndefined();
    expect(sessions.delete("new.md")?.buffer).toBe("changed");
    expect(sessions.get("new.md")).toBeUndefined();
  });
});

describe("nearestNeighborAfterClose", () => {
  it("prefers the right tab, then the left tab", () => {
    expect(nearestNeighborAfterClose(["a", "b", "c"], "b")).toBe("c");
    expect(nearestNeighborAfterClose(["a", "b", "c"], "c")).toBe("b");
    expect(nearestNeighborAfterClose(["a"], "a")).toBeNull();
    expect(nearestNeighborAfterClose(["a"], "missing")).toBeNull();
  });
});
