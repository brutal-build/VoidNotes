import { describe, expect, it } from "vitest";
import { isPathInside, validateEntryName, validateRelativePath } from "../../electron/path-safety";

describe("path safety", () => {
  it("accepts a nested path inside the vault", () => {
    expect(isPathInside("C:\\Vault", "C:\\Vault\\notes\\a.md", "win32")).toBe(true);
  });

  it("rejects sibling paths that share the vault prefix", () => {
    expect(isPathInside("C:\\Vault", "C:\\Vault-copy\\a.md", "win32")).toBe(false);
  });

  it("rejects traversal and absolute relative paths", () => {
    expect(validateRelativePath("../secret.md", "file")).toMatchObject({ ok: false, code: "PATH_TRAVERSAL" });
    expect(validateRelativePath("C:\\secret.md", "file")).toMatchObject({ ok: false, code: "ABSOLUTE_PATH" });
  });

  it("rejects invalid and reserved Windows names", () => {
    expect(validateEntryName("CON", "folder")).toMatchObject({ ok: false, code: "RESERVED_NAME" });
    expect(validateEntryName("bad:name", "file")).toMatchObject({ ok: false, code: "INVALID_CHARACTER" });
    expect(validateEntryName("note. ", "file")).toMatchObject({ ok: false, code: "TRAILING_CHARACTER" });
  });

  it("accepts valid note and folder names", () => {
    expect(validateEntryName("Project notes.md", "file")).toEqual({ ok: true, value: "Project notes.md" });
    expect(validateEntryName("Research", "folder")).toEqual({ ok: true, value: "Research" });
  });
});
