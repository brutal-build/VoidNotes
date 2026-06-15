import React from "react";

interface CanvasViewProps {
  onClose: () => void;
}

export default function CanvasView({ onClose }: CanvasViewProps) {
  return (
    <div className="canvas-view">
      <div className="canvas-header">
        <h3 className="canvas-title">Canvas</h3>
        <button className="btn-icon" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="canvas-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px", flex: 1 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
          Canvas view coming soon.<br/>
          An infinite whiteboard for your notes and ideas.
        </p>
      </div>
    </div>
  );
}
