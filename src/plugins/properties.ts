/**
 * properties.ts
 *
 * Core system for managing note properties (YAML frontmatter).
 * Parsing, validation, type detection, and serialization.
 */

import matter from "gray-matter";

export type PropType = 'string' | 'number' | 'boolean' | 'date' | 'tags';

export interface PropDefinition {
  key: string;
  label: string;
  type: PropType;
}

export const DEFAULT_PROPERTIES: PropDefinition[] = [
  { key: 'title', label: 'Title', type: 'string' },
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'tags', label: 'Tags', type: 'tags' },
];

export interface ParsedProperties {
  data: Record<string, unknown>;
  content: string;
  error?: string;
}

export function parseProperties(raw: string): ParsedProperties {
  try {
    const result = matter(raw);
    return { data: result.data as Record<string, unknown>, content: result.content };
  } catch (error) {
    return { data: {}, content: raw, error: error instanceof Error ? error.message : 'Invalid YAML frontmatter' };
  }
}

export function serializeProperties(content: string, data: Record<string, unknown>, parseError?: string): string {
  if (parseError) throw new Error(parseError);
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    clean[key] = val;
  }
  if (Object.keys(clean).length === 0) return content;
  return matter.stringify(content, clean);
}

export function validateValue(value: unknown, type: PropType): unknown {
  switch (type) {
    case 'string': return String(value ?? '');
    case 'number': {
      const n = Number(value);
      return isNaN(n) ? 0 : n;
    }
    case 'boolean': return value === true || value === 'true' || value === 1;
    case 'date': {
      if (!value) return new Date().toISOString().split('T')[0];
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
    }
    case 'tags': {
      const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
      return Array.from(new Set(values.filter(v => v != null).map(v => String(v).trim().replace(/^#+/, '').toLowerCase()).filter(Boolean)));
    }
    default: return value;
  }
}

export function detectType(value: unknown): PropType {
  if (value === null || value === undefined) return 'string';
  if (Array.isArray(value)) return 'tags';
  if (value instanceof Date && !isNaN(value.getTime())) return 'date';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  return 'string';
}
