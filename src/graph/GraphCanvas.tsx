/**
 * GraphCanvas.tsx
 *
 * Canvas-based force-directed graph renderer.
 * Features: pan (LMB drag on empty), zoom (scroll), hover highlight, click to open.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GraphNode, GraphEdge, getNeighbors } from './graph-engine';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (noteId: string) => void;
  onNodeDrag?: (noteId: string, x: number, y: number) => void;
  onNodeDragEnd?: (noteId: string) => void;
  width: number;
  height: number;
  linkThickness: number;
  showArrows: boolean;
}

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export default function GraphCanvas({ nodes, edges, onNodeClick, onNodeDrag, onNodeDragEnd, width, height, linkThickness, showArrows }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const draggedNode = useRef<string | null>(null);
  const draggedFrom = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  const animFrameRef = useRef<number>(0);
  const needsRedrawRef = useRef(true);

  // Keep ref in sync with state
  useEffect(() => { transformRef.current = transform; }, [transform]);

  // Mark canvas dirty when visual state changes
  useEffect(() => {
    needsRedrawRef.current = true;
  }, [nodes, edges, hoveredNode, transform, linkThickness, showArrows, width, height]);

  // ─── Rendering ──────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: tx, y: ty, scale: s } = transformRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(s, s);

    // Rysuj krawędzie
    const neighbors = hoveredNode ? getNeighbors(hoveredNode, edges) : null;
    const highlightedNodes = neighbors
      ? new Set([hoveredNode!, ...neighbors])
      : null;

    const lw = linkThickness * (s > 0.5 ? 1 : 1.5);

    for (const edge of edges) {
      const source = typeof edge.source === 'object' ? (edge.source as any) : null;
      const target = typeof edge.target === 'object' ? (edge.target as any) : null;
      if (!source || !target || source.x === undefined || target.x === undefined) continue;

      const isHighlighted = highlightedNodes
        ? highlightedNodes.has(source.id) && highlightedNodes.has(target.id)
        : true;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.lineWidth = lw;
      ctx.strokeStyle = isHighlighted ? `rgba(148, 148, 168, ${hoveredNode ? 0.5 : 0.22})` : 'rgba(148, 148, 168, 0.05)';
      ctx.stroke();

      // Arrows
      if (showArrows && isHighlighted) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) continue;
        const ux = dx / dist;
        const uy = dy / dist;
        const nodeR = (target.size || 6) + 4;
        const tipX = target.x - ux * nodeR;
        const tipY = target.y - uy * nodeR;
        const arrowLen = 6 * lw;
        const arrowW = 3 * lw;

        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - ux * arrowLen + uy * arrowW, tipY - uy * arrowLen - ux * arrowW);
        ctx.lineTo(tipX - ux * arrowLen - uy * arrowW, tipY - uy * arrowLen + ux * arrowW);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    }

  // Rysuj węzły
    for (const node of nodes) {
      if (node.x === undefined || node.y === undefined) continue;

      const isHovered = hoveredNode === node.id;
      const isNeighbor = neighbors?.has(node.id);
      const dimmed = hoveredNode && !isHovered && !isNeighbor;
      const alpha = dimmed ? 0.12 : (isHovered ? 1 : 0.7);
      const displaySize = isHovered ? node.size * 1.35 : node.size;

      // Glow dla hoverowanego węzła
      if (isHovered) {
        ctx.save();
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(node.x, node.y, displaySize, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.restore();
      }

      // Główny węzeł
      ctx.beginPath();
      ctx.arc(node.x, node.y, displaySize, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = alpha;
      ctx.fill();

      // Obwódka dla hoverowanego
      if (isHovered) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Subtelna obwódka dla sąsiadów
      if (isNeighbor && !isHovered) {
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Etykieta
      if (s > 0.22 || isHovered) {
        ctx.font = isHovered
          ? `600 12px "Cascadia Code", "Fira Code", monospace`
          : `400 10px "Cascadia Code", "Fira Code", monospace`;
        ctx.fillStyle = dimmed
          ? 'rgba(171, 178, 191, 0.15)'
          : (isHovered ? '#ffffff' : '#abb2bf');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // Subtelny shadow dla tekstu hoverowanego
        if (isHovered) {
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4;
          ctx.fillText(node.label, node.x, node.y + displaySize + 8);
          ctx.restore();
        } else {
          ctx.fillText(node.label, node.x, node.y + displaySize + 8);
        }
      }
    }

    ctx.restore();
  }, [nodes, edges, hoveredNode, width, height, linkThickness, showArrows]);

  // Animation loop with dirty flag
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      if (!needsRedrawRef.current) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      draw();
      needsRedrawRef.current = false;
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    };
  }, [draw]);

  // ─── Eventy myszy ───────────────────────────────────────

  const screenToGraph = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const { x: tx, y: ty, scale: s } = transformRef.current;
    return {
      x: (clientX - rect.left - tx) / s,
      y: (clientY - rect.top - ty) / s,
    };
  }, []);

  const findNodeAt = useCallback((pos: { x: number; y: number }) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.x === undefined || node.y === undefined) continue;
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      if (dx * dx + dy * dy <= (node.size + 5) * (node.size + 5)) {
        return node;
      }
    }
    return null;
  }, [nodes]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = screenToGraph(e.clientX, e.clientY);
    const node = findNodeAt(pos);

    if (node) {
      draggedNode.current = node.id;
      draggedFrom.current = { x: node.x ?? 0, y: node.y ?? 0 };
    } else {
      isPanning.current = true;
      panStart.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      };
    }
  }, [screenToGraph, findNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = screenToGraph(e.clientX, e.clientY);

    if (draggedNode.current) {
      const dragged = nodes.find(n => n.id === draggedNode.current);
      if (dragged) {
        dragged.x = pos.x;
        dragged.y = pos.y;
        onNodeDrag?.(draggedNode.current, pos.x, pos.y);
      }
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    } else {
      const node = findNodeAt(pos);
      if (node) {
        setHoveredNode(node.id);
        if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        if (canvasRef.current) canvasRef.current.style.cursor = 'default';
      }
    }

    if (isPanning.current) {
      setTransform({
        ...transformRef.current,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    }
  }, [screenToGraph, findNodeAt, nodes, onNodeDrag]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggedNode.current) {
      const nodeId = draggedNode.current;
      const pos = screenToGraph(e.clientX, e.clientY);
      const dragDist = Math.hypot(pos.x - draggedFrom.current.x, pos.y - draggedFrom.current.y);
      if (dragDist < 5) {
        const node = findNodeAt(pos);
        if (node && node.id === nodeId) {
          onNodeClick(node.id);
        }
      }
      draggedNode.current = null;
      onNodeDragEnd?.(nodeId);
      if (canvasRef.current) canvasRef.current.style.cursor = 'default';
    }
    isPanning.current = false;
  }, [screenToGraph, findNodeAt, onNodeClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.max(0.1, Math.min(3, transformRef.current.scale * (1 + delta)));

    // Zoom względem kursora
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setTransform(prev => ({
      scale: newScale,
      x: mx - (mx - prev.x) * (newScale / prev.scale),
      y: my - (my - prev.y) * (newScale / prev.scale),
    }));
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="graph-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}
