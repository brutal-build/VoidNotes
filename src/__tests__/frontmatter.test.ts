import { describe, it, expect } from "vitest";
import { parseFrontmatter, buildBacklinks, buildTagIndex, extractInlineTags } from "../plugins/frontmatter";

describe("parseFrontmatter", () => {
  it("parses YAML frontmatter", () => {
    const raw = `---
title: Test Note
tags: [a, b, c]
date: 2024-01-01
---
Content here`;
    const result = parseFrontmatter(raw);
    expect(result.data.title).toBe("Test Note");
    expect(result.data.tags).toEqual(["a", "b", "c"]);
    expect(result.data.date).toEqual(new Date("2024-01-01"));
    expect(result.content.trim()).toBe("Content here");
  });

  it("returns empty frontmatter when none present", () => {
    const result = parseFrontmatter("Just plain content");
    expect(result.data).toEqual({});
    expect(result.content).toBe("Just plain content");
  });
});

describe("buildBacklinks", () => {
  it("builds reverse link index", () => {
    const notes = new Map([
      ["note-a.md", "Links to [[note-b.md]]"],
      ["note-b.md", "Links to [[note-c.md]] and [[note-a.md]]"],
      ["note-c.md", "No links here"],
    ]);
    const backlinks = buildBacklinks(notes);
    expect(backlinks.get("note-a.md")).toEqual(["note-b.md"]);
    expect(backlinks.get("note-b.md")).toEqual(["note-a.md"]);
    expect(backlinks.get("note-c.md")).toEqual(["note-b.md"]);
  });

  it("normalizes links without .md extension", () => {
    const notes = new Map([
      ["note-a.md", "Links to [[note-b]]"],
    ]);
    const backlinks = buildBacklinks(notes);
    expect(backlinks.get("note-b.md")).toEqual(["note-a.md"]);
  });
});

describe("buildTagIndex", () => {
  it("builds tag index from frontmatter and inline tags", () => {
    const notes = new Map([
      ["note-a.md", `---
tags: [javascript, react]
---
#hello #world`],
      ["note-b.md", "#javascript content"],
    ]);
    const index = buildTagIndex(notes);
    expect(index.get("javascript")).toEqual(["note-a.md", "note-b.md"]);
    expect(index.get("react")).toEqual(["note-a.md"]);
    expect(index.get("hello")).toEqual(["note-a.md"]);
  });
});

describe("extractInlineTags", () => {
  it("extracts hashtags from content", () => {
    expect(extractInlineTags("Hello #world and #foo")).toEqual(["world", "foo"]);
  });

  it("returns empty for no tags", () => {
    expect(extractInlineTags("No tags here")).toEqual([]);
  });
});
