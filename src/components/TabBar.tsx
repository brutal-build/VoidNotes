import React, { useRef, useState, useCallback } from "react";

export interface Tab {
  id: string;
  label: string;
  dirty: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function TabBar({ tabs, activeTab, onSelect, onClose, onReorder }: TabBarProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
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
    <div className="tab-bar" ref={containerRef}>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTab ? "active" : ""} ${dragIndex === index ? "dragging" : ""} ${dropIndex === index ? "drop-target" : ""}`}
          onClick={() => onSelect(tab.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <span className="tab-label">
            {tab.dirty && <span className="tab-dirty">&#8226;</span>}
            {tab.label}
          </span>
          <button
            className="tab-close"
            onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
            title="Close tab"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
