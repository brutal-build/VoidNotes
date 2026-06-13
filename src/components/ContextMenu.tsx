import React, { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (rect.right > vw) ref.current.style.left = `${vw - rect.width - 8}px`;
      if (rect.bottom > vh) ref.current.style.top = `${vh - rect.height - 8}px`;
    }
  }, [x, y]);

  return (
    <div ref={ref} className="context-menu" style={{ left: x, top: y }}>
      {items.map((item, i) => (
        <div
          key={i}
          className={`context-menu-item ${item.danger ? "context-menu-danger" : ""}`}
          onClick={() => {
            item.action();
            onClose();
          }}
        >
          {item.icon && <span className="context-menu-icon">{item.icon}</span>}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
