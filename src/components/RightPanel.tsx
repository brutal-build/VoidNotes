import React, { useMemo, useState } from "react";
import PropertiesPanel from "./PropertiesPanel";
import { parseFrontmatter } from "../plugins/frontmatter";
import { extractWikiLinks } from "../plugins/wiki-links-utils";

type PanelTab = "backlinks" | "outgoing" | "tags" | "outline" | "properties";
type SortOrder = "alphabetical" | "by-count";

interface RightPanelProps {
  activeNote: string | null;
  content: string;
  backlinks: string[];
  tags: string[];
  onNavigate: (note: string) => void;
  activePanelTab: PanelTab;
  onPanelTabChange: (tab: PanelTab) => void;
  onContentSave?: (newContent: string) => void;
  splitView: boolean;
  splitDown: boolean;
  onToggleSplit: () => void;
  onToggleSplitDown: () => void;
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

function extractOutgoingLinks(content: string): string[] {
  return extractWikiLinks(content, true);
}

function extractNoteTags(content: string): string[] {
  const parsed = parseFrontmatter(content);
  const fmTags = parsed.data.tags || [];
  const inlineRegex = /(?<=^|\s)#([a-zA-Z0-9_\-ćłóżźąęśń]+)/g;
  const inlineTags: string[] = [];
  let match;
  while ((match = inlineRegex.exec(parsed.content)) !== null) {
    inlineTags.push(match[1].toLowerCase());
  }
  return [...new Set([...fmTags, ...inlineTags])].sort();
}

export default function RightPanel({
  activeNote, content, backlinks, tags, onNavigate,
  activePanelTab, onPanelTabChange, onContentSave,
  splitView, splitDown, onToggleSplit, onToggleSplitDown,
}: RightPanelProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const outgoingLinks = useMemo(() => extractOutgoingLinks(content), [content]);
  const noteTags = useMemo(() => extractNoteTags(content), [content]);

  // Tags state
  const [tagSort, setTagSort] = useState<SortOrder>("alphabetical");
  const [tagSearch, setTagSearch] = useState("");
  const [tagExpanded, setTagExpanded] = useState(true);

  // Properties state
  const [propSearch, setPropSearch] = useState("");
  const [propSort, setPropSort] = useState<SortOrder>("alphabetical");

  // Sort + filter tags
  const filteredTags = useMemo(() => {
    let list = activePanelTab === "tags" ? tags : noteTags;
    if (tagSearch) {
      const q = tagSearch.toLowerCase();
      list = list.filter(t => t.toLowerCase().includes(q));
    }
    if (tagSort === "alphabetical") {
      return [...list].sort();
    }
    // by-count: count occurrences
    type TagCount = { tag: string; count: number };
    const counts: TagCount[] = [];
    for (const t of list) {
      const existing = counts.find(c => c.tag === t);
      if (existing) existing.count++;
      else counts.push({ tag: t, count: 1 });
    }
    return counts.sort((a, b) => b.count - a.count).map(c => c.tag);
  }, [tags, noteTags, activePanelTab, tagSort, tagSearch]);

  const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: "backlinks", label: "Backlinks", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
    { id: "outgoing", label: "Outgoing", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> },
    { id: "tags", label: "Tags", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
    { id: "outline", label: "Outline", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { id: "properties", label: "Properties", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> },
  ];

  // Check if all tags are from the vault-wide index or note-specific
  const isVaultTags = activePanelTab === "tags" && tags.length > 0;

  return (
    <div className="right-panel">
      <div className="panel-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`panel-tab ${activePanelTab === t.id ? "active" : ""}`}
            onClick={() => onPanelTabChange(t.id)}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
        <div className="panel-tabs-actions">
          <button className={`panel-split-btn ${splitView ? 'active' : ''}`} onClick={onToggleSplit} title="Split right">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          </button>
          <button className={`panel-split-btn ${splitDown ? 'active' : ''}`} onClick={onToggleSplitDown} title="Split down">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </button>
        </div>
      </div>

      <div className="panel-content">
        {/* Backlinks */}
        {activePanelTab === "backlinks" && (
          <div className="panel-section">
            {backlinks.length === 0 ? (
              <div className="panel-empty">No backlinks found</div>
            ) : backlinks.map(note => (
              <button key={note} className="panel-item" onClick={() => onNavigate(note)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>{note.replace(/\.md$/, "")}</span>
              </button>
            ))}
          </div>
        )}

        {/* Outgoing Links */}
        {activePanelTab === "outgoing" && (
          <div className="panel-section">
            {outgoingLinks.length === 0 ? (
              <div className="panel-empty">No outgoing links</div>
            ) : outgoingLinks.map(link => (
              <button key={link} className="panel-item" onClick={() => onNavigate(link)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>{link.replace(/\.md$/, "")}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        {activePanelTab === "tags" && (
          <div className="panel-section">
            <div className="panel-toolbar">
              <input
                className="panel-search"
                type="text"
                placeholder="Filter tags..."
                value={tagSearch}
                onChange={e => setTagSearch(e.currentTarget.value)}
              />
              <select
                className="panel-sort"
                value={tagSort}
                onChange={e => setTagSort(e.currentTarget.value as SortOrder)}
              >
                <option value="alphabetical">A-Z</option>
                <option value="by-count">By count</option>
              </select>
              <button
                className="panel-btn-icon"
                onClick={() => setTagExpanded(v => !v)}
                title={tagExpanded ? "Collapse" : "Expand"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: tagExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
            {filteredTags.length === 0 ? (
              <div className="panel-empty">{tagSearch ? "No matching tags" : "No tags found"}</div>
            ) : (
              <div className={`panel-tags ${tagExpanded ? 'expanded' : ''}`}>
                {filteredTags.map(tag => (
                  <span key={tag} className="panel-tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outline */}
        {activePanelTab === "outline" && (
          <div className="panel-section">
            {headings.length === 0 ? (
              <div className="panel-empty">No headings found</div>
            ) : headings.map((h, i) => (
              <button
                key={i}
                className="panel-outline-item"
                style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                onClick={() => {
                  const editor = document.querySelector(".md-content");
                  if (!editor) return;
                  const headingText = h.text.replace(/[*_`]/g, "");
                  const allHeaders = editor.querySelectorAll("h1, h2, h3, h4, h5, h6");
                  for (const header of allHeaders) {
                    if (header.textContent?.trim() === headingText) {
                      header.scrollIntoView({ behavior: "smooth", block: "start" });
                      header.classList.add("outline-highlight");
                      setTimeout(() => header.classList.remove("outline-highlight"), 2000);
                      break;
                    }
                  }
                }}
              >
                <span className="outline-level">H{h.level}</span>
                <span className="outline-text">{h.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Properties */}
        {activePanelTab === "properties" && (
          <div className="panel-section panel-section-properties">
            {activeNote ? (
              <>
                <div className="panel-toolbar">
                  <input
                    className="panel-search"
                    type="text"
                    placeholder="Filter properties..."
                    value={propSearch}
                    onChange={e => setPropSearch(e.currentTarget.value)}
                  />
                  <select
                    className="panel-sort"
                    value={propSort}
                    onChange={e => setPropSort(e.currentTarget.value as SortOrder)}
                  >
                    <option value="alphabetical">A-Z</option>
                    <option value="by-count">By count</option>
                  </select>
                </div>
                <PropertiesPanel
                  rawContent={content}
                  onSave={onContentSave || (() => {})}
                />
              </>
            ) : (
              <div className="panel-empty">No note open</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
