import { describe, expect, it } from 'vitest';
import { detectType, parseProperties, serializeProperties, validateValue } from '../plugins/properties';

describe('properties pipeline', () => {
  it('reports invalid YAML and preserves the original document', () => {
    const raw = '---\ntags: [broken\n---\nBody';
    const parsed = parseProperties(raw);
    expect(parsed.error).toMatch(/yaml|unexpected|flow/i);
    expect(parsed.content).toBe(raw);
    expect(() => serializeProperties(parsed.content, { title: 'Changed' }, parsed.error)).toThrow();
  });

  it('updates properties without losing body or unrelated typed fields', () => {
    const raw = '---\ntitle: Old\ncount: 3\npublished: true\ndate: 2024-02-03\naliases: [One, Two]\nempty: null\ncustom: keep\n---\nBody\n\nText';
    const parsed = parseProperties(raw);
    const output = serializeProperties(parsed.content, { ...parsed.data, title: 'New' });
    const reparsed = parseProperties(output);
    expect(reparsed.content.trimEnd()).toBe(parsed.content.trimEnd());
    expect(reparsed.data).toMatchObject({ title: 'New', count: 3, published: true, aliases: ['One', 'Two'], empty: null, custom: 'keep' });
    expect(reparsed.data.date).toEqual(new Date('2024-02-03'));
  });

  it('normalizes tags consistently', () => {
    expect(validateValue([' Foo ', '#bar', 'foo', '', null], 'tags')).toEqual(['foo', 'bar']);
    expect(validateValue(' Foo, #BAR, foo ', 'tags')).toEqual(['foo', 'bar']);
  });

  it('detects supported YAML value types safely', () => {
    expect(detectType('2024-01-02')).toBe('date');
    expect(detectType(new Date('2024-01-02'))).toBe('date');
    expect(detectType(null)).toBe('string');
    expect(detectType(['a'])).toBe('tags');
  });
});
