import React, { useState, useEffect, useCallback } from "react";

interface CanvasViewProps {
  vaultPath: string | null;
  onClose: () => void;
}

const STORAGE_PREFIX = "void-canvas:";

export default function CanvasView({ vaultPath, onClose }: CanvasViewProps) {
  const storageKey = `${STORAGE_PREFIX}${vaultPath ?? "default"}`;
  const [canvasData, setCanvasData] = useState<string>(() => {
    try { return localStorage.getItem(storageKey) ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, canvasData); } catch {}
  }, [canvasData, storageKey]);

  const handleClear = useCallback(() => {
    setCanvasData("");
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCanvasData(e.target.value);
  }, []);

  return (
    <div className="canvas-view">
      <div className="canvas-header">
        <div className="canvas-header-left">
          <h3 className="canvas-title">Canvas</h3>
          <span className="canvas-scratchpad-label">Scratchpad - changes are temporary</span>
        </div>
        <div className="canvas-header-actions">
          <button className="btn-secondary canvas-clear-btn" onClick={handleClear} title="Clear Canvas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            Clear Canvas
          </button>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="canvas-content">
        <textarea
          className="canvas-textarea"
          value={canvasData}
          onChange={handleChange}
          placeholder="Start typing your scratchpad notes here..."
        />
      </div>
    </div>
  );
}
