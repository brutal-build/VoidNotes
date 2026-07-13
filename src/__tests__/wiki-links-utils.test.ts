import { describe, it, expect } from "vitest";
import { extractWikiLinks, parseWikiLink, resolveWikiLink } from "../plugins/wiki-links-utils";

describe("extractWikiLinks", () => {
  it("extracts simple wiki links", () => {
    const content = "Check out [[my-note]] and [[other-note]]";
    expect(extractWikiLinks(content)).toEqual(["my-note", "other-note"]);
  });

  it("handles aliases (pipe syntax)", () => {
    const content = "See [[long-note-name|display text]] here";
    expect(extractWikiLinks(content)).toEqual(["long-note-name"]);
  });

  it("deduplicates links", () => {
    const content = "[[note]] [[note]] [[note]]";
    expect(extractWikiLinks(content)).toEqual(["note"]);
  });

  it("returns empty array for no links", () => {
    expect(extractWikiLinks("plain text")).toEqual([]);
  });

  it("normalizes with .md extension", () => {
    const content = "[[my-note]] [[other.md]]";
    expect(extractWikiLinks(content, true)).toEqual(["my-note.md", "other.md"]);
  });

  it("handles multiple same links with different aliases", () => {
    const content = "[[note|first]] and [[note|second]]";
    expect(extractWikiLinks(content)).toEqual(["note"]);
  });
});

describe("parseWikiLink", () => {
  it("parses folder paths, headings, and aliases", () => {
    expect(parseWikiLink("projects/Alpha#Launch Plan|Open plan")).toEqual({
      target: "projects/Alpha",
      heading: "Launch Plan",
      alias: "Open plan",
    });
  });
});

describe("resolveWikiLink", () => {
  const notes = ["Alpha.md", "projects/Alpha.md", "projects/Beta.md"];

  it("prefers an exact folder-qualified path", () => {
    expect(resolveWikiLink("projects/Alpha#Plan", notes)).toEqual({
      status: "resolved",
      path: "projects/Alpha.md",
      heading: "Plan",
    });
  });

  it("reports ambiguous display names instead of choosing silently", () => {
    expect(resolveWikiLink("Alpha", notes)).toEqual({
      status: "ambiguous",
      candidates: ["Alpha.md", "projects/Alpha.md"],
    });
  });

  it("returns a normalized creation path for missing notes", () => {
    expect(resolveWikiLink("ideas/New Idea", notes)).toEqual({
      status: "missing",
      suggestedPath: "ideas/New Idea.md",
    });
  });
});
