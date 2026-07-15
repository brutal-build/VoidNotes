import { useState, useCallback } from "react";
import type { ContextMenuItem } from "../components/ContextMenu";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
  });

  const showContextMenu = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    setState({ isOpen: true, x, y, items });
  }, []);

  const closeContextMenu = useCallback(() => {
    setState((prev) => prev.isOpen ? { ...prev, isOpen: false } : prev);
  }, []);

  return { ...state, showContextMenu, closeContextMenu };
}
