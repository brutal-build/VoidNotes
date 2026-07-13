/**
 * wiki-links.ts — shared parser for [[wiki links]]
 *
 * Consolidated to avoid duplication between graph-engine.ts and frontmatter.ts.
 */

export interface ParsedWikiLink {
  target: string;
  heading?: string;
  alias?: string;
}

export type WikiLinkResolution =
  | { status: "resolved"; path: string; heading?: string }
  | { status: "ambiguous"; candidates: string[] }
  | { status: "missing"; suggestedPath: string };

const normalizeSlashes = (value: string) => value.replace(/\\/g, "/").replace(/^\.\//, "");
const withoutMarkdownExtension = (value: string) => value.replace(/\.md$/i, "");

export function parseWikiLink(raw: string): ParsedWikiLink {
  const [destination, aliasPart] = raw.split("|", 2);
  const hashIndex = destination.indexOf("#");
  const target = (hashIndex >= 0 ? destination.slice(0, hashIndex) : destination).trim();
  const heading = hashIndex >= 0 ? destination.slice(hashIndex + 1).trim() : "";
  const alias = aliasPart?.trim();
  return {
    target: normalizeSlashes(target),
    ...(heading ? { heading } : {}),
    ...(alias ? { alias } : {}),
  };
}

export function resolveWikiLink(raw: string, notePaths: readonly string[]): WikiLinkResolution {
  const parsed = parseWikiLink(raw);
  const target = withoutMarkdownExtension(parsed.target);
  const normalizedNotes = notePaths.map(normalizeSlashes);
  const exactPath = normalizedNotes.find((note) => withoutMarkdownExtension(note).toLowerCase() === target.toLowerCase());

  if (parsed.target.includes("/") && exactPath) {
    return { status: "resolved", path: exactPath, ...(parsed.heading ? { heading: parsed.heading } : {}) };
  }

  const displayName = target.split("/").pop() ?? target;
  const candidates = normalizedNotes
    .filter((note) => (withoutMarkdownExtension(note).split("/").pop() ?? "").toLowerCase() === displayName.toLowerCase())
    .sort((a, b) => a.localeCompare(b));

  if (candidates.length === 1) {
    return { status: "resolved", path: candidates[0], ...(parsed.heading ? { heading: parsed.heading } : {}) };
  }
  if (candidates.length > 1) return { status: "ambiguous", candidates };

  const suggestedPath = `${target}.md`;
  return { status: "missing", suggestedPath };
}

export function extractWikiLinks(content: string, normalizeMd = false): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const target = parseWikiLink(match[1]).target;
    links.push(normalizeMd ? (target.endsWith('.md') ? target : `${target}.md`) : target);
  }
  return Array.from(new Set(links));
}
