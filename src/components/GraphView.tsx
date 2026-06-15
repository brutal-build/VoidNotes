import React, { useMemo, useCallback } from "react";
import { ForceGraph2D } from "react-force-graph";

interface GraphViewProps {
  notes: string[];
  backlinks: Map<string, string[]>;
  activeNote: string | null;
  onNodeClick: (note: string) => void;
  onClose: () => void;
}

interface GraphNode {
  id: string;
  label: string;
  group: string;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
}

function extractFolder(path: string): string {
  const parts = path.split("/");
  return parts.length > 1 ? parts[0] : "root";
}

export default function GraphView({ notes, backlinks, activeNote, onNodeClick, onClose }: GraphViewProps) {
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = notes.map((note) => {
      const label = note.replace(/\.md$/, "").split("/").pop() || note;
      const folder = extractFolder(note);
      const backlinkCount = (backlinks.get(note) || []).length;
      return {
        id: note,
        label,
        group: folder,
        val: 1 + backlinkCount * 0.5,
      };
    });

    const links: GraphLink[] = [];
    for (const [target, sources] of backlinks.entries()) {
      for (const source of sources) {
        links.push({ source, target });
      }
    }

    return { nodes, links };
  }, [notes, backlinks]);

  const nodeColor = useCallback((node: any) => {
    if (node.id === activeNote) return "#8a70d6";
    const colors = ["#4a9eff", "#98c379", "#e5c07b", "#e06c75", "#c678dd", "#56b6c2"];
    const folder = node.group || "root";
    let hash = 0;
    for (let i = 0; i < folder.length; i++) {
      hash = folder.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [activeNote]);

  const handleNodeClick = useCallback((node: any) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div className="graph-view">
      <div className="graph-header">
        <h3 className="graph-title">Graph View</h3>
        <button className="btn-icon" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="graph-canvas">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="label"
          nodeColor={nodeColor}
          nodeRelSize={6}
          linkColor={() => "rgba(138, 112, 214, 0.3)"}
          linkWidth={1}
          onNodeClick={handleNodeClick}
          backgroundColor="transparent"
          width={400}
          height={600}
          nodeCanvasObject={(node: any, ctx) => {
            const label = node.label;
            const fontSize = 10;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillStyle = nodeColor(node);
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val * 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "#e0e0e0";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(label, node.x, node.y + node.val * 3 + 2);
          }}
        />
      </div>
    </div>
  );
}
