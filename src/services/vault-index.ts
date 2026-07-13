export interface VaultIndexEntryInput {
  path: string;
  content: string;
  modifiedAt?: number;
}

export interface VaultIndexEntry extends Required<VaultIndexEntryInput> {
  filename: string;
  tags: string[];
  frontmatter: Record<string, unknown>;
  headings: string[];
  wikiLinks: string[];
}

export interface VaultIndexResult extends VaultIndexEntry {
  score: number;
}

const normalizePath = (path: string): string => path.replace(/\\/g, "/");
const text = (value: unknown): string => Array.isArray(value) ? value.join(" ") : String(value ?? "");

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^(["'])(.*)\1$/, "$2");
}

function parseDocument(content: string): Omit<VaultIndexEntry, keyof Required<VaultIndexEntryInput> | "filename"> {
  let body = content;
  let frontmatter: Record<string, unknown> = {};
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (match) {
    body = content.slice(match[0].length);
    try {
      const parsed: Record<string, unknown> = {};
      for (const line of match[1].split(/\r?\n/)) {
        if (!line.trim()) continue;
        const property = line.match(/^([\w.-]+):\s*(.*)$/);
        if (!property) throw new Error("Malformed frontmatter");
        const raw = property[2].trim();
        if ((raw.startsWith("[") && !raw.endsWith("]")) || (raw.startsWith("{") && !raw.endsWith("}"))) {
          throw new Error("Malformed frontmatter");
        }
        parsed[property[1]] = parseScalar(raw);
      }
      frontmatter = parsed;
    } catch {
      frontmatter = {};
    }
  }
  const headings = [...body.matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)].map((item) => item[1].trim());
  const wikiLinks = [...body.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)].map((item) => item[1].trim());
  const inlineTags = [...body.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu)].map((item) => item[1]);
  const propertyTags = Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) :
    typeof frontmatter.tags === "string" ? frontmatter.tags.split(/[ ,]+/).filter(Boolean) : [];
  return { frontmatter, headings, wikiLinks, tags: [...new Set([...propertyTags, ...inlineTags])] };
}

export class VaultIndex {
  private readonly entries = new Map<string, VaultIndexEntry>();

  constructor(entries: VaultIndexEntryInput[] = []) {
    for (const entry of entries) this.add(entry);
  }

  get size(): number { return this.entries.size; }

  add(input: VaultIndexEntryInput): VaultIndexEntry {
    const path = normalizePath(input.path);
    const entry: VaultIndexEntry = {
      path,
      filename: path.split("/").pop() ?? path,
      content: input.content,
      modifiedAt: input.modifiedAt ?? 0,
      ...parseDocument(input.content),
    };
    this.entries.set(path, entry);
    return entry;
  }

  update(input: VaultIndexEntryInput): VaultIndexEntry { return this.add(input); }
  get(path: string): VaultIndexEntry | undefined { return this.entries.get(normalizePath(path)); }
  remove(path: string): boolean { return this.entries.delete(normalizePath(path)); }

  rename(oldPath: string, newPath: string): boolean {
    const entry = this.get(oldPath);
    if (!entry) return false;
    this.remove(oldPath);
    this.add({ ...entry, path: newPath });
    return true;
  }

  allEntries(): VaultIndexEntry[] {
    return [...this.entries.values()];
  }

  query(query: string, limit = 50): VaultIndexResult[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return [...this.entries.values()].map((entry) => {
      const exactFilename = entry.filename.replace(/\.md$/i, "").toLowerCase() === needle;
      const includes = (values: string[]) => values.some((value) => value.toLowerCase().includes(needle));
      let score = exactFilename ? 600 : entry.path.toLowerCase().includes(needle) ? 550 : 0;
      if (!score && includes(entry.headings)) score = 500;
      if (!score && includes(entry.tags)) score = 400;
      if (!score && Object.entries(entry.frontmatter).some(([key, value]) => `${key} ${text(value)}`.toLowerCase().includes(needle))) score = 300;
      if (!score && includes(entry.wikiLinks)) score = 200;
      if (!score && entry.content.toLowerCase().includes(needle)) score = 100;
      return { ...entry, score };
    }).filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.modifiedAt - a.modifiedAt || a.path.localeCompare(b.path))
      .slice(0, Math.max(0, limit));
  }
}
