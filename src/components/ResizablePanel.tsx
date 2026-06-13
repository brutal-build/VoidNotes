import React, { useCallback, useRef, useEffect, useState } from "react";

interface ResizablePanelProps {
  side: "left" | "right";
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey?: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

export default function ResizablePanel({ side, defaultWidth, minWidth, maxWidth, storageKey, children, collapsed }: ResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const w = parseInt(stored, 10);
        if (w >= minWidth && w <= maxWidth) return w;
      }
    }
    return defaultWidth;
  });
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    startX.current = e.clientX;
    startWidth.current = width;
  }, [width]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = side === "left"
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setDragging(false);
      if (storageKey) {
        localStorage.setItem(storageKey, String(width));
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, width, side, minWidth, maxWidth, storageKey]);

  if (collapsed) return null;

  return (
    <div
      className={`resizable-panel resizable-panel-${side}`}
      style={{ width }}
    >
      {children}
      <div
        className={`resize-handle resize-handle-${side} ${dragging ? "active" : ""}`}
        onMouseDown={handleMouseDown}
      >
        <div className="resize-handle-bar" />
      </div>
    </div>
  );
}
