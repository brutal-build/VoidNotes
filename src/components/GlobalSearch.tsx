import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { VaultIndex } from "../services/vault-index";

export function buildSearchIndex(notes: string[], contents: Map<string, string>, modifiedAt = new Map<string, number>()): VaultIndex {
  return new VaultIndex(notes.map((path) => ({ path, content: contents.get(path) ?? "", modifiedAt: modifiedAt.get(path) ?? 0 })));
}

export function getHighlightedParts(value: string, query: string): [string, string, string] {
  const needle = query.trim();
  const start = value.toLowerCase().indexOf(needle.toLowerCase());
  if (start < 0 || !needle) return [value, "", ""];
  return [value.slice(0, start), value.slice(start, start + needle.length), value.slice(start + needle.length)];
}

interface GlobalSearchProps {
  notes: string[];
  contents: Map<string, string>;
  vaultIndex: VaultIndex;
  onSelect: (note: string) => void;
  onClose: () => void;
}

interface SearchResult {
  note: string;
  line: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

function searchInContent(query: string, contents: Map<string, string>): SearchResult[] {
  const results: SearchResult[] = [];
  const q = query.toLowerCase();
  for (const [note, content] of contents.entries()) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const idx = line.indexOf(q);
      if (idx !== -1) {
        results.push({ note, line: i + 1, text: lines[i], matchStart: idx, matchEnd: idx + query.length });
      }
    }
  }
  return results.slice(0, 100);
}

export default function GlobalSearch({ notes, contents, vaultIndex, onSelect, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return vaultIndex.query(query, 100).map((entry) => {
      const lines = entry.content.split("\n");
      const lineIndex = lines.findIndex((line) => line.toLowerCase().includes(query.trim().toLowerCase()));
      const text = lineIndex >= 0 ? lines[lineIndex] : entry.path;
      const matchStart = text.toLowerCase().indexOf(query.trim().toLowerCase());
      return { note: entry.path, line: Math.max(1, lineIndex + 1), text, matchStart: Math.max(0, matchStart), matchEnd: matchStart < 0 ? 0 : matchStart + query.trim().length };
    });
  }, [query, vaultIndex]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") { e.preventDefault(); setSelected((p) => Math.min(p + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((p) => Math.max(p - 1, 0)); }
    else if (e.key === "Enter" && results.length > 0) onSelect(results[selected].note);
  }, [results, selected, onSelect, onClose]);

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search" onClick={(e) => e.stopPropagation()}>
        <input ref={inputRef} className="global-search-input" placeholder="Search in all notes... (Ctrl+Shift+F)" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
        <div className="global-search-results">
          {query && results.length === 0 && <div className="global-search-empty">No results found</div>}
          {results.map((result, i) => (
            <button key={`${result.note}-${result.line}`} className={`global-search-item ${i === selected ? "selected" : ""}`} onClick={() => onSelect(result.note)} onMouseEnter={() => setSelected(i)}>
              <div className="search-item-header">
                <span className="search-item-note">{result.note.replace(/\.md$/, "").split("/").pop()}</span>
                <span className="search-item-line">:{result.line}</span>
              </div>
              <div className="search-item-text">
                {result.text.substring(0, result.matchStart)}
                <span className="search-highlight">{result.text.substring(result.matchStart, result.matchEnd)}</span>
                {result.text.substring(result.matchEnd)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
