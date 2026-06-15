import matter from "gray-matter";

export interface FrontmatterData {
  title?: string;
  tags?: string[];
  date?: string;
  [key: string]: unknown;
}

export interface ParsedNote {
  data: FrontmatterData;
  content: string;
}

export function parseFrontmatter(raw: string): ParsedNote {
  try {
    const result = matter(raw);
    return {
      data: result.data as FrontmatterData,
      content: result.content,
    };
  } catch {
    return { data: {}, content: raw };
  }
}

export function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

export function buildBacklinks(allNotes: Map<string, string>): Map<string, string[]> {
  const backlinks = new Map<string, string[]>();

  for (const [fileName, content] of allNotes) {
    const links = extractWikiLinks(content);
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
    const frontTags = (data.tags || []).map((t: string) => t.toLowerCase());
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
