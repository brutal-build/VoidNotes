export const EXTRACT_TAGS_REGEX = /(?:^|\s)#([\p{L}\p{N}_\/-]+)/gu;

export function extractTags(text: string): string[] {
  const tags: string[] = [];
  for (const match of text.matchAll(EXTRACT_TAGS_REGEX)) {
    tags.push(match[1]);
  }
  return tags;
}
