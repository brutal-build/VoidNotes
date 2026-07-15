import { useCallback, useRef, useState } from "react";

export function useSplitView() {
  const [splitView, setSplitView] = useState(() => {
    try { return localStorage.getItem("void-split-view") === "true"; } catch { return false; }
  });
  const [splitRatio, setSplitRatio] = useState(() => {
    try { return parseFloat(localStorage.getItem("void-split-ratio") || "0.5") || 0.5; } catch { return 0.5; }
  });
  const [splitDown, setSplitDown] = useState(false);
  const splitRatioRef = useRef(splitRatio);

  const toggleSplitView = useCallback(() => {
    setSplitView((prev) => {
      const next = !prev;
      try { localStorage.setItem("void-split-view", String(next)); } catch {}
      return next;
    });
  }, []);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = document.querySelector(".pane-container");
    if (!container) return;
    const isVertical = container.classList.contains("split-down");
    const rect = container.getBoundingClientRect();
    const startPos = isVertical ? e.clientY : e.clientX;
    const startSize = isVertical ? rect.height : rect.width;
    const startRatio = splitRatioRef.current;

    const editorEl = container.querySelector(".pane-editor") as HTMLElement | null;
    const previewEl = container.querySelector(".pane-preview") as HTMLElement | null;

    const originalPreviewOpacity = previewEl?.style.opacity || "1";
    const originalPreviewPointer = previewEl?.style.pointerEvents || "auto";
    if (previewEl) {
      previewEl.style.opacity = "0.3";
      previewEl.style.pointerEvents = "none";
      previewEl.style.transition = "none";
    }

    const onMove = (ev: MouseEvent) => {
      const delta = (isVertical ? ev.clientY : ev.clientX) - startPos;
      const ratio = Math.min(0.9, Math.max(0.1, startRatio + delta / startSize));
      splitRatioRef.current = ratio;
      if (editorEl) editorEl.style.flex = `0 0 ${ratio * 100}%`;
      if (previewEl) previewEl.style.flex = `0 0 ${(1 - ratio) * 100}%`;
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      if (previewEl) {
        previewEl.style.opacity = originalPreviewOpacity;
        previewEl.style.pointerEvents = originalPreviewPointer;
        previewEl.style.transition = "";
      }

      const finalRatio = splitRatioRef.current;
      setSplitRatio(finalRatio);
      try { localStorage.setItem("void-split-ratio", String(finalRatio)); } catch {}
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  return {
    splitView,
    splitDown,
    splitRatio,
    setSplitView,
    setSplitDown,
    toggleSplitView,
    handleSplitMouseDown,
  };
}
