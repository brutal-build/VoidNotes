import React, { useMemo } from "react";

interface RightPanelProps {
  activeNote: string | null;
  content: string;
  backlinks: string[];
  tags: string[];
  onNavigate: (note: string) => void;
  activePanelTab: "backlinks" | "tags" | "outline";
  onPanelTabChange: (tab: "backlinks" | "tags" | "outline") => void;
}

interface OutlineItem {
  level: number;
  text: string;
  line: number;
}

function extractHeadings(content: string): OutlineItem[] {
  const headings: OutlineItem[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1"),
        line: i,
      });
    }
  }
  return headings;
}

export default function RightPanel({ activeNote, content, backlinks, tags, onNavigate, activePanelTab, onPanelTabChange }: RightPanelProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  return (
    <div className="right-panel">
      <div className="panel-tabs">
        <button className={`panel-tab ${activePanelTab === "backlinks" ? "active" : ""}`} onClick={() => onPanelTabChange("backlinks")}>Backlinks</button>
        <button className={`panel-tab ${activePanelTab === "tags" ? "active" : ""}`} onClick={() => onPanelTabChange("tags")}>Tags</button>
        <button className={`panel-tab ${activePanelTab === "outline" ? "active" : ""}`} onClick={() => onPanelTabChange("outline")}>Outline</button>
      </div>
      <div className="panel-content">
        {activePanelTab === "backlinks" && (
          <div className="panel-section">
            {backlinks.length === 0 ? <div className="panel-empty">No backlinks found</div> : backlinks.map((note) => (
              <button key={note} className="panel-item" onClick={() => onNavigate(note)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>{note.replace(/\.md$/, "")}</span>
              </button>
            ))}
          </div>
        )}
        {activePanelTab === "tags" && (
          <div className="panel-section">
            {tags.length === 0 ? <div className="panel-empty">No tags found</div> : tags.map((tag) => (
              <span key={tag} className="panel-tag">#{tag}</span>
            ))}
          </div>
        )}
        {activePanelTab === "outline" && (
          <div className="panel-section">
            {headings.length === 0 ? <div className="panel-empty">No headings found</div> : headings.map((h, i) => (
              <button key={i} className="panel-outline-item" style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}>
                <span className="outline-level">H{h.level}</span>
                <span className="outline-text">{h.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
