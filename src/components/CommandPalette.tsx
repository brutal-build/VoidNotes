import React, { useState, useEffect, useRef, useMemo } from "react";

interface CommandPaletteProps {
  notes: string[];
  onSelect: (fileName: string) => void;
  onClose: () => void;
}

type PaletteItem = { type: "note"; value: string };

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette({ notes, onSelect, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo<PaletteItem[]>(() => {
    const q = query.trim();
    const noteItems: PaletteItem[] = notes
      .filter((n) => !q || fuzzyMatch(q, n.replace(/\.md$/, "")))
      .map((n) => ({ type: "note" as const, value: n }));
    return noteItems;
  }, [notes, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered.length > 0) {
      const item = filtered[selected];
      onSelect(item.value);
    }
  };

  const handleClick = (item: PaletteItem) => {
    onSelect(item.value);
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette-input"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="command-palette-list">
          {filtered.length === 0 && (
            <div className="command-palette-item" style={{ color: "var(--text-faint)" }}>
              No results found
            </div>
          )}
          {filtered.map((item, i) => (
            <div
              key={`note-${item.value}`}
              className={`command-palette-item ${i === selected ? "selected" : ""}`}
              onClick={() => handleClick(item)}
              onMouseEnter={() => setSelected(i)}
            >
              <span className="command-palette-item-icon">📄</span>
              <span className="command-palette-item-name">
                {item.value.split("/").pop()?.replace(/\.md$/, "") || item.value}
              </span>
              {item.value.includes("/") && (
                <span className="command-palette-item-path">
                  {item.value.substring(0, item.value.lastIndexOf("/"))}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
