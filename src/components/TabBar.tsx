import React, { useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ContextMenu, { ContextMenuItem } from "./ContextMenu";
import type { Tab } from "../types";

interface TabBarProps {
  tabs: Tab[];
  activeTab: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function TabBar({ tabs, activeTab, onSelect, onClose, onReorder }: TabBarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  }, []);

  const contextMenuItems: ContextMenuItem[] = contextMenu ? [
    { label: "Close", icon: "close", action: () => onClose(contextMenu.tabId), shortcut: "Ctrl+W" },
    { label: "Close Others", action: () => { for (const t of tabs) { if (t.id !== contextMenu.tabId) onClose(t.id); } } },
    { label: "Close to Right", action: () => {
      const idx = tabs.findIndex((t) => t.id === contextMenu.tabId);
      for (let i = idx + 1; i < tabs.length; i++) onClose(tabs[i].id);
    }},
    { label: "Close All", action: () => { for (const t of tabs) onClose(t.id); } },
  ] : [];

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  }, [dragIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  return (
    <div className="tab-bar" role="tablist" aria-label="Open notes">
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTab ? "active" : ""} ${dragIndex === index ? "dragging" : ""} ${dropIndex === index ? "drop-target" : ""}`}
          onClick={() => onSelect(tab.id)}
          role="tab"
          aria-selected={tab.id === activeTab}
          aria-label={`${tab.label}${tab.dirty ? ", unsaved changes" : ""}`}
          tabIndex={tab.id === activeTab ? 0 : -1}
          onKeyDown={(e) => {
            const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (delta) { e.preventDefault(); onSelect(tabs[(index + delta + tabs.length) % tabs.length].id); }
            if (e.key === "Home") { e.preventDefault(); onSelect(tabs[0].id); }
            if (e.key === "End") { e.preventDefault(); onSelect(tabs[tabs.length - 1].id); }
            if (e.key === "Delete") { e.preventDefault(); onClose(tab.id); }
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
        >
          <span className="tab-label">
            {tab.dirty && <span className="tab-dirty">&#8226;</span>}
            {tab.label}
          </span>
          <button className="tab-close" onClick={(e) => { e.stopPropagation(); onClose(tab.id); }} title="Close tab" aria-label={`Close ${tab.label}`} tabIndex={-1}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
      {contextMenu && createPortal(
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />,
        document.body
      )}
    </div>
  );
}
