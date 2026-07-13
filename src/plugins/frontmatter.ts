import matter from "gray-matter";
import { extractWikiLinks } from "../plugins/wiki-links-utils";

export interface FrontmatterData {
  title?: string;
  tags?: string[] | string;
  date?: string;
  [key: string]: unknown;
}

export interface ParsedNote {
  data: FrontmatterData;
  content: string;
  error?: string;
}

export function parseFrontmatter(raw: string): ParsedNote {
  try {
    const result = matter(raw);
    return {
      data: result.data as FrontmatterData,
      content: result.content,
    };
  } catch (error) {
    return { data: {}, content: raw, error: error instanceof Error ? error.message : "Invalid YAML frontmatter" };
  }
}

export function buildBacklinks(allNotes: Map<string, string>): Map<string, string[]> {
  const backlinks = new Map<string, string[]>();

  for (const [fileName, content] of allNotes) {
    const links = extractWikiLinks(content, false);
    for (const link of links) {
      const targetFile = link.endsWith(".md") ? link : `${link}.md`;
      if (!backlinks.has(targetFile)) {
        backlinks.set(targetFile, []);
      }
      backlinks.get(targetFile)!.push(fileName);
    }
  }

  return backlinks;
}

export function extractInlineTags(content: string): string[] {
  const regex = /(?<=^|\s)#([a-zA-Z0-9_-]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return tags;
}

export function buildTagIndex(allNotes: Map<string, string>): Map<string, string[]> {
  const tagIndex = new Map<string, string[]>();

  for (const [fileName, raw] of allNotes) {
    const { data, content } = parseFrontmatter(raw);
    const rawTags = Array.isArray(data.tags) ? data.tags : typeof data.tags === "string" ? data.tags.split(",") : [];
    const frontTags = rawTags.map(String).map(tag => tag.trim().replace(/^#+/, "").toLowerCase()).filter(Boolean);
    const inlineTags = extractInlineTags(content);
    const allTags = [...new Set([...frontTags, ...inlineTags])];

    for (const tag of allTags) {
      if (!tagIndex.has(tag)) {
        tagIndex.set(tag, []);
      }
      tagIndex.get(tag)!.push(fileName);
    }
  }

  return tagIndex;
}
