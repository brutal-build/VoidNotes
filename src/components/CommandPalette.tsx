import React, { useState, useEffect, useRef, useMemo } from "react";

interface CommandPaletteProps {
  notes: string[];
  onSelect: (fileName: string) => void;
  onClose: () => void;
}

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

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    return notes.filter((n) => fuzzyMatch(query, n.replace(/\.md$/, "")));
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
      onSelect(filtered[selected]);
    }
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
              No notes found
            </div>
          )}
          {filtered.map((file, i) => (
            <div
              key={file}
              className={`command-palette-item ${i === selected ? "selected" : ""}`}
              onClick={() => onSelect(file)}
              onMouseEnter={() => setSelected(i)}
            >
              <span className="command-palette-item-icon">&#128196;</span>
              <span className="command-palette-item-name">
                {file.split("/").pop()?.replace(/\.md$/, "") || file}
              </span>
              {file.includes("/") && (
                <span className="command-palette-item-path">
                  {file.substring(0, file.lastIndexOf("/"))}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
