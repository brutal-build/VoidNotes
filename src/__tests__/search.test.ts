import { describe, expect, it } from "vitest";
import { buildSearchIndex, getHighlightedParts } from "../components/GlobalSearch";

describe("search foundations", () => {
  const contents = new Map([
    ["projects/alpha.md", "---\nstatus: active\ntags: [urgent]\n---\n# Launch\nA rocket body"],
    ["recent.md", "rocket body"],
  ]);

  it("integrates filename, path, content, tag, property, and recency through VaultIndex", () => {
    const index = buildSearchIndex(["projects/alpha.md", "recent.md"], contents, new Map([["recent.md", 20], ["projects/alpha.md", 10]]));
    expect(index.query("alpha")[0]?.path).toBe("projects/alpha.md");
    expect(index.query("projects")[0]?.path).toBe("projects/alpha.md");
    expect(index.query("rocket").map((item) => item.path)).toEqual(["recent.md", "projects/alpha.md"]);
    expect(index.query("urgent")[0]?.path).toBe("projects/alpha.md");
    expect(index.query("active")[0]?.path).toBe("projects/alpha.md");
  });

  it("returns safe case-insensitive highlight parts", () => {
    expect(getHighlightedParts("A Rocket body", "rocket")).toEqual(["A ", "Rocket", " body"]);
    expect(getHighlightedParts("plain", "missing")).toEqual(["plain", "", ""]);
  });
});
