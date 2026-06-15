import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

interface GlobalSearchProps {
  notes: string[];
  contents: Map<string, string>;
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
        results.push({
          note,
          line: i + 1,
          text: lines[i],
          matchStart: idx,
          matchEnd: idx + query.length,
        });
      }
    }
  }

  return results.slice(0, 100);
}

export default function GlobalSearch({ notes, contents, onSelect, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchInContent(query, contents);
  }, [query, contents]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results.length > 0) {
      onSelect(results[selected].note);
    }
  }, [results, selected, onSelect, onClose]);

  const highlightMatch = (text: string, start: number, end: number) => {
    return (
      <>
        {text.substring(0, start)}
        <span className="search-highlight">{text.substring(start, end)}</span>
        {text.substring(end)}
      </>
    );
  };

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="global-search-input"
          placeholder="Search in all notes... (Ctrl+Shift+F)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="global-search-results">
          {query && results.length === 0 && (
            <div className="global-search-empty">No results found</div>
          )}
          {results.map((result, i) => (
            <button
              key={`${result.note}-${result.line}`}
              className={`global-search-item ${i === selected ? "selected" : ""}`}
              onClick={() => onSelect(result.note)}
              onMouseEnter={() => setSelected(i)}
            >
              <div className="search-item-header">
                <span className="search-item-note">
                  {result.note.replace(/\.md$/, "").split("/").pop()}
                </span>
                <span className="search-item-line">:{result.line}</span>
              </div>
              <div className="search-item-text">
                {highlightMatch(result.text, result.matchStart, result.matchEnd)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
