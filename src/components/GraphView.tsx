import React, { useEffect, useState, useRef, useMemo } from 'react';
import { buildGraph, computeLayout, applyFilter, DEFAULT_FILTER, GraphData, GraphFilter, GraphEdge, GraphNode, ColorMode, SizeMode } from '../graph/graph-engine';
import GraphCanvas from '../graph/GraphCanvas';

interface GraphViewProps {
  notes: string[];
  backlinks: Map<string, string[]>;
  activeNote: string | null;
  onNodeClick: (note: string) => void;
  onClose: () => void;
}

function getConnectedNodes(
  startId: string,
  linkMap: Map<string, Set<string>>,
  depth: number
): Set<string> {
  const visited = new Set<string>([startId]);
  let frontier = new Set<string>([startId]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const id of frontier) {
      const neighbors = linkMap.get(id);
      if (neighbors) {
        for (const nb of neighbors) {
          if (!visited.has(nb)) { visited.add(nb); next.add(nb); }
        }
      }
    }
    for (const [note, targets] of linkMap) {
      for (const id of frontier) {
        if (targets.has(id) && !visited.has(note)) { visited.add(note); next.add(note); }
      }
    }
    frontier = next;
    if (next.size === 0) break;
  }
  return visited;
}

export default function GraphView({ notes, backlinks, activeNote, onNodeClick, onClose }: GraphViewProps) {
  const [rawGraphData, setRawGraphData] = useState<GraphData | null>(null);
  const [layoutResult, setLayoutResult] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [filter, setFilter] = useState<GraphFilter>(DEFAULT_FILTER);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [depth, setDepth] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 480, height: 600 });

  // Click outside to close settings
  useEffect(() => {
    if (!showSettings) return;
    const h = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showSettings]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    buildGraph(notes, async (note): Promise<string> => {
      const result = await window.electronAPI.loadNote(note);
      if (!result.ok) {
        setLoadError(result.error.message);
        return '';
      }
      return result.value;
    })
      .then(data => setRawGraphData(data))
      .catch(error => {
        setRawGraphData(null);
        setLoadError(error instanceof Error ? error.message : 'Unable to load graph');
      })
      .finally(() => setLoading(false));
  }, [notes]);

  useEffect(() => {
    if (!rawGraphData) return;
    let data = rawGraphData;
    if (localOnly && activeNote && rawGraphData.nodes.length > 0) {
      const linkMap = new Map<string, Set<string>>();
      for (const n of rawGraphData.nodes) linkMap.set(n.id, new Set());
      for (const e of rawGraphData.edges) {
        const s = typeof e.source === 'string' ? e.source : (e.source as any).id;
        const t = typeof e.target === 'string' ? e.target : (e.target as any).id;
        linkMap.get(s)?.add(t); linkMap.get(t)?.add(s);
      }
      const connected = getConnectedNodes(activeNote, linkMap, depth);
      data = {
        nodes: rawGraphData.nodes.filter(n => connected.has(n.id)),
        edges: rawGraphData.edges.filter(e => {
          const s = typeof e.source === 'string' ? e.source : (e.source as any).id;
          const t = typeof e.target === 'string' ? e.target : (e.target as any).id;
          return connected.has(s) && connected.has(t);
        }),
      };
    }
    const folders = data.nodes.map(n => n.folder).filter(Boolean) as string[];
    const uniqueFolders = [...new Set(folders)].sort();
    const filtered = applyFilter(data, filter, uniqueFolders);
    const result = computeLayout(filtered, { width: size.width, height: size.height });
    setLayoutResult(result);
  }, [rawGraphData, filter, size, localOnly, depth, activeNote]);

  const folders = useMemo(() => {
    if (!rawGraphData) return [];
    return [...new Set(rawGraphData.nodes.map(n => n.folder).filter(Boolean))].sort();
  }, [rawGraphData]);

  const totalNodes = rawGraphData?.nodes.length ?? 0;
  const visibleNodes = layoutResult?.nodes.length ?? 0;
  const visibleEdges = layoutResult?.edges.length ?? 0;
  const isLocalActive = localOnly && activeNote !== null;

  return (
    <div className="graph-view">
      {/* Header */}
      <div className="graph-header">
        <div className="graph-header-left">
          <h3 className="graph-title">Graph View</h3>
          <span className="graph-node-count">{totalNodes} notes</span>
        </div>
        <div className="graph-header-actions">
          {/* Local/Global toggle */}
          <label className="graph-toggle-label" title={isLocalActive ? "Showing local graph" : "Showing all notes"}>
            <input type="checkbox" checked={isLocalActive} onChange={e => setLocalOnly(e.target.checked)} disabled={!activeNote} />
            <span className="graph-toggle-text">Local</span>
          </label>
          {/* Settings gear */}
          <div className="graph-settings-wrap" ref={settingsRef}>
            <button className={`btn-icon ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(v => !v)} title="Graph settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            {showSettings && (
              <div className="graph-settings-dropdown">
                {/* Search */}
                <div className="gs-group">
                  <div className="gs-field-row">
                    <span className="gs-field-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
                    <input className="gs-input" type="text" placeholder="Filter nodes..." value={filter.searchQuery} onChange={e => setFilter({ ...filter, searchQuery: e.target.value })} />
                  </div>
                </div>
                {/* Orphans */}
                <label className="gs-checkbox">
                  <input type="checkbox" checked={filter.hideOrphans} onChange={e => setFilter({ ...filter, hideOrphans: e.target.checked })} />
                  <span className="gs-check-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></span>
                  <span>Hide orphans</span>
                </label>
                {/* Folder */}
                <div className="gs-group">
                  <div className="gs-field-row">
                    <span className="gs-field-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>
                    <select className="gs-select" value={filter.folderPath} onChange={e => setFilter({ ...filter, folderPath: e.target.value })}>
                      <option value="">All folders</option>
                      {folders.map(f => (<option key={f} value={f}>{f}</option>))}
                    </select>
                  </div>
                </div>
                {/* Min connections */}
                <div className="gs-group">
                  <div className="gs-slider-row">
                    <span className="gs-field-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
                    <span className="gs-slider-label">Min links</span>
                    <span className="gs-slider-value">{filter.minConnections}</span>
                  </div>
                  <input className="gs-range" type="range" min={0} max={20} value={filter.minConnections} onChange={e => setFilter({ ...filter, minConnections: Number(e.target.value) })} />
                </div>
                {/* Divider */}
                <div className="gs-divider" />
                {/* Color mode */}
                <div className="gs-group">
                  <span className="gs-select-label">Color by</span>
                  <div className="gs-chip-row">
                    {(['default', 'folder', 'degree'] as ColorMode[]).map(mode => (
                      <button key={mode} className={`gs-chip ${filter.colorMode === mode ? 'active' : ''}`} onClick={() => setFilter({ ...filter, colorMode: mode })}>
                        {mode === 'default' ? 'Hash' : mode === 'folder' ? 'Folder' : 'Degree'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Size mode */}
                <div className="gs-group">
                  <span className="gs-select-label">Node size</span>
                  <div className="gs-chip-row">
                    {(['degree', 'fixed'] as SizeMode[]).map(mode => (
                      <button key={mode} className={`gs-chip ${filter.sizeMode === mode ? 'active' : ''}`} onClick={() => setFilter({ ...filter, sizeMode: mode })}>
                        {mode === 'degree' ? 'By degree' : 'Fixed'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="btn-icon" onClick={onClose} title="Close graph view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="graph-filter-bar">
        {isLocalActive && (
          <div className="gf-depth">
            <span className="gf-label">Depth</span>
            <input className="gf-range" type="range" min={1} max={5} value={depth} onChange={e => setDepth(Number(e.target.value))} />
            <span className="gf-value">{depth}</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="graph-body" ref={containerRef}>
        <div className="graph-canvas-container">
          {loading ? (
            <div className="graph-loading"><div className="graph-spinner" /><span>Loading {totalNodes} notes...</span></div>
          ) : loadError ? (
            <div className="graph-empty" role="alert"><p>{loadError}</p></div>
          ) : layoutResult && visibleNodes > 0 ? (
            <GraphCanvas nodes={layoutResult.nodes} edges={layoutResult.edges} onNodeClick={id => onNodeClick(id)} width={size.width} height={size.height} />
          ) : (
            <div className="graph-empty">
              <p>{isLocalActive ? 'No linked notes at depth ' + depth : 'No notes found'}</p>
              <p className="graph-empty-hint">{isLocalActive ? 'Increase depth or switch to global.' : 'Add [[wiki links]] to connect notes'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="graph-footer">
        <span>{visibleNodes} visible</span><span className="graph-footer-sep">·</span>
        <span>{visibleEdges} connections</span>
      </div>
    </div>
  );
}
