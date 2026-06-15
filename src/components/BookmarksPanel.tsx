import React from "react";

interface BookmarksPanelProps {
  bookmarks: string[];
  activeNote: string | null;
  onToggleBookmark: (note: string) => void;
  onSelect: (note: string) => void;
  onClose: () => void;
}

export default function BookmarksPanel({ bookmarks, activeNote, onToggleBookmark, onSelect, onClose }: BookmarksPanelProps) {
  return (
    <div className="bookmarks-panel">
      <div className="bookmarks-header">
        <h3 className="bookmarks-title">Bookmarks</h3>
        <button className="btn-icon" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="bookmarks-list">
        {bookmarks.length === 0 ? (
          <div className="bookmarks-empty">No bookmarks yet. Right-click a note to bookmark it.</div>
        ) : bookmarks.map((note) => (
          <div key={note} className={`bookmark-item ${note === activeNote ? "active" : ""}`}>
            <button className="bookmark-name" onClick={() => onSelect(note)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span>{note.replace(/\.md$/, "").split("/").pop()}</span>
            </button>
            <button className="bookmark-remove" onClick={() => onToggleBookmark(note)} title="Remove bookmark">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
