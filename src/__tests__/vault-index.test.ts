import { describe, expect, it } from "vitest";
import { VaultIndex, type VaultIndexEntryInput } from "../services/vault-index";

const note = (path: string, content: string, modifiedAt = 0): VaultIndexEntryInput => ({ path, content, modifiedAt });

describe("VaultIndex", () => {
  it("adds and searches parsed note metadata", () => {
    const index = new VaultIndex();
    index.add(note("projects/alpha.md", `---\nstatus: active\nowner: Ada\ntags: [work, urgent]\n---\n# Launch Plan\nShip the rocket. #space\nSee [[Mission Control|control]].`, 100));

    const entry = index.get("projects/alpha.md");
    expect(entry).toMatchObject({
      path: "projects/alpha.md",
      filename: "alpha.md",
      tags: ["work", "urgent", "space"],
      frontmatter: { status: "active", owner: "Ada", tags: ["work", "urgent"] },
      headings: ["Launch Plan"],
      wikiLinks: ["Mission Control"],
    });
    expect(index.query("rocket")[0]?.path).toBe("projects/alpha.md");
    expect(index.query("control")[0]?.path).toBe("projects/alpha.md");
    expect(index.query("active")[0]?.path).toBe("projects/alpha.md");
  });

  it("updates, removes, and renames entries incrementally", () => {
    const index = new VaultIndex([note("old.md", "old phrase")]);
    index.update(note("old.md", "new phrase", 2));
    expect(index.query("old phrase")).toEqual([]);
    expect(index.query("new phrase")[0]?.path).toBe("old.md");

    expect(index.rename("old.md", "archive/new.md")).toBe(true);
    expect(index.get("old.md")).toBeUndefined();
    expect(index.get("archive/new.md")?.filename).toBe("new.md");
    expect(index.remove("archive/new.md")).toBe(true);
    expect(index.size).toBe(0);
  });

  it("ranks exact filenames before headings, tags, properties, links, content, and recency", () => {
    const index = new VaultIndex([
      note("orbit.md", "nothing", 1),
      note("heading.md", "# Orbit", 2),
      note("tag.md", "#orbit", 3),
      note("property.md", "---\ntopic: orbit\n---", 4),
      note("link.md", "[[orbit]]", 5),
      note("content.md", "an orbit appears here", 6),
    ]);
    expect(index.query("orbit").map((result) => result.path)).toEqual([
      "orbit.md", "heading.md", "tag.md", "property.md", "link.md", "content.md",
    ]);

    const recent = new VaultIndex([note("a.md", "same", 1), note("b.md", "same", 2)]);
    expect(recent.query("same").map((result) => result.path)).toEqual(["b.md", "a.md"]);
  });

  it("isolates malformed frontmatter while indexing the remaining note", () => {
    const index = new VaultIndex([
      note("broken.md", "---\ntags: [broken\n---\n# Still Searchable\nbody needle"),
      note("healthy.md", "healthy needle"),
    ]);
    expect(index.get("broken.md")?.frontmatter).toEqual({});
    expect(index.query("Still Searchable")[0]?.path).toBe("broken.md");
    expect(index.query("needle").map((result) => result.path)).toHaveLength(2);
  });

  it("normalizes paths and returns empty results for blank queries", () => {
    const index = new VaultIndex([note("folder\\note.md", "text")]);
    expect(index.get("folder/note.md")?.path).toBe("folder/note.md");
    expect(index.query("   ")).toEqual([]);
  });
});
