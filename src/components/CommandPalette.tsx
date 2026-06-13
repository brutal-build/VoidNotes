import React, { useState, useEffect, useRef, useMemo } from "react";
import { pluginSystem } from "../plugins/pluginSystem";
import { CommandEntry } from "../plugins/pluginInterface";

interface CommandPaletteProps {
  notes: string[];
  onSelect: (fileName: string) => void;
  onClose: () => void;
}

type PaletteItem =
  | { type: "note"; value: string }
  | { type: "command"; command: CommandEntry };

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

  const pluginCommands = pluginSystem.getCommandRegistry().getAll();
  const api = pluginSystem.getAPI();

  const filtered = useMemo<PaletteItem[]>(() => {
    const q = query.trim();
    const cmdItems: PaletteItem[] = pluginCommands
      .filter((c) => !q || fuzzyMatch(q, c.title))
      .map((c) => ({ type: "command" as const, command: c }));

    const noteItems: PaletteItem[] = notes
      .filter((n) => !q || fuzzyMatch(q, n.replace(/\.md$/, "")))
      .map((n) => ({ type: "note" as const, value: n }));

    if (!q) return [...cmdItems, ...noteItems];

    const matchedCmds = cmdItems.filter((i) => i.type === "command" && fuzzyMatch(q, i.command.title));
    const matchedNotes = noteItems.filter((i) => i.type === "note" && fuzzyMatch(q, i.value.replace(/\.md$/, "")));
    return [...matchedCmds, ...matchedNotes];
  }, [notes, query, pluginCommands]);

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
      if (item.type === "command") {
        item.command.action(api);
        onClose();
      } else {
        onSelect(item.value);
      }
    }
  };

  const handleClick = (item: PaletteItem) => {
    if (item.type === "command") {
      item.command.action(api);
      onClose();
    } else {
      onSelect(item.value);
    }
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="command-palette-input"
          placeholder="Search notes or commands..."
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
              key={item.type === "command" ? `cmd-${item.command.id}` : `note-${item.value}`}
              className={`command-palette-item ${i === selected ? "selected" : ""}`}
              onClick={() => handleClick(item)}
              onMouseEnter={() => setSelected(i)}
            >
              <span className="command-palette-item-icon">
                {item.type === "command" ? (item.command.icon || "\u{2699}\u{FE0F}") : "\u{1F4C4}"}
              </span>
              <span className="command-palette-item-name">
                {item.type === "command"
                  ? item.command.title
                  : item.value.split("/").pop()?.replace(/\.md$/, "") || item.value}
              </span>
              {item.type === "note" && item.value.includes("/") && (
                <span className="command-palette-item-path">
                  {item.value.substring(0, item.value.lastIndexOf("/"))}
                </span>
              )}
              {item.type === "command" && item.command.category && (
                <span className="command-palette-item-path">{item.command.category}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
