// @vitest-environment node
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createNote,
  deletePermanently,
  listNotes,
  loadNote,
  renameNote,
  restoreNote,
  saveNote,
  trashNote,
  validateWritableVault,
} from "../../electron/note-files";

let vault: string;

beforeEach(async () => {
  vault = await fs.promises.mkdtemp(path.join(os.tmpdir(), "void-notes-"));
});

afterEach(async () => {
  await fs.promises.rm(vault, { recursive: true, force: true });
});

describe("note files", () => {
  it("validates a writable directory and rejects a file", async () => {
    expect(await validateWritableVault(vault)).toEqual({ ok: true, value: await fs.promises.realpath(vault) });
    const file = path.join(vault, "file");
    await fs.promises.writeFile(file, "x");
    await expect(validateWritableVault(file)).resolves.toMatchObject({ ok: false, error: { code: "VAULT_NOT_DIRECTORY" } });
  });

  it("lists markdown notes and empty folders while excluding trash", async () => {
    await fs.promises.mkdir(path.join(vault, "empty"));
    await fs.promises.mkdir(path.join(vault, "nested"));
    await fs.promises.writeFile(path.join(vault, "root.md"), "root");
    await fs.promises.writeFile(path.join(vault, "nested", "child.md"), "child");
    await fs.promises.writeFile(path.join(vault, "ignored.txt"), "ignored");
    await fs.promises.mkdir(path.join(vault, ".void-trash"));
    await fs.promises.writeFile(path.join(vault, ".void-trash", "gone.md"), "gone");

    await expect(listNotes(vault)).resolves.toEqual({
      ok: true,
      value: { notes: ["nested/child.md", "root.md"], emptyFolders: ["empty"] },
    });
  });

  it("creates, loads, atomically saves, and renames a note", async () => {
    await expect(createNote(vault, "folder/New note")).resolves.toEqual({ ok: true, value: "folder/New note.md" });
    await expect(saveNote(vault, "folder/New note.md", "hello")).resolves.toEqual({ ok: true, value: undefined });
    await expect(loadNote(vault, "folder/New note.md")).resolves.toEqual({ ok: true, value: "hello" });
    await expect(renameNote(vault, "folder/New note.md", "Renamed")).resolves.toEqual({ ok: true, value: "folder/Renamed.md" });
    expect((await fs.promises.readdir(path.join(vault, "folder"))).filter((name) => name.includes(".tmp"))).toEqual([]);
  });

  it("returns structured validation and duplicate errors", async () => {
    await expect(createNote(vault, "../escape")).resolves.toMatchObject({ ok: false, error: { code: "PATH_TRAVERSAL" } });
    await createNote(vault, "same");
    await expect(createNote(vault, "same")).resolves.toMatchObject({ ok: false, error: { code: "ALREADY_EXISTS" } });
    await expect(loadNote(vault, "missing.md")).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("moves notes to vault-local trash, restores them, and permanently deletes them", async () => {
    await createNote(vault, "folder/note");
    await saveNote(vault, "folder/note.md", "recover me");
    const trashed = await trashNote(vault, "folder/note.md");
    expect(trashed).toMatchObject({ ok: true });
    if (!trashed.ok) throw new Error("trash failed");
    expect(trashed.value.trashId).toBeTruthy();
    expect(await fs.promises.readFile(path.join(vault, ".void-trash", trashed.value.trashId, "note.md"), "utf8")).toBe("recover me");

    await expect(restoreNote(vault, trashed.value.trashId)).resolves.toEqual({ ok: true, value: "folder/note.md" });
    const trashedAgain = await trashNote(vault, "folder/note.md");
    if (!trashedAgain.ok) throw new Error("trash failed");
    await expect(deletePermanently(vault, trashedAgain.value.trashId)).resolves.toEqual({ ok: true, value: undefined });
    await expect(fs.promises.access(path.join(vault, ".void-trash", trashedAgain.value.trashId))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
