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
