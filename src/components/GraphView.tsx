import React, { useEffect, useState, useRef, useMemo } from 'react';
import { buildGraph, computeLayout, applyFilter, DEFAULT_FILTER, DEFAULT_LAYOUT_OPTIONS, GraphData, GraphFilter, GraphEdge, GraphNode, ColorMode, SizeMode } from '../graph/graph-engine';
import type { Simulation } from 'd3-force';
import type { SimulationNodeDatum } from 'd3-force';
import GraphCanvas from '../graph/GraphCanvas';
import EmptyState from './EmptyState';

interface GraphViewProps {
  notes: string[];
  allContents: Map<string, string>;
  backlinks: Map<string, string[]>;
  activeNote: string | null;
  onNodeClick: (note: string) => void;
  onClose: () => void;
}

export default function GraphView({ notes, allContents, backlinks, activeNote, onNodeClick, onClose }: GraphViewProps) {
  const [filter, setFilter] = useState<GraphFilter>(DEFAULT_FILTER);
  const [layoutOptions, setLayoutOptions] = useState(() => ({
    chargeStrength: DEFAULT_LAYOUT_OPTIONS.chargeStrength!,
    linkDistance: DEFAULT_LAYOUT_OPTIONS.linkDistance!,
    linkStrength: DEFAULT_LAYOUT_OPTIONS.linkStrength!,
    centerStrength: DEFAULT_LAYOUT_OPTIONS.centerStrength!,
  }));
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'filters' | 'forces' | 'display'>('filters');
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

  // Build graph asynchronously with deferral for large vaults
  const [rawGraphData, setRawGraphData] = useState<GraphData | null>(null);
  const [graphBuilding, setGraphBuilding] = useState(false);

  useEffect(() => {
    if (notes.length === 0) {
      setRawGraphData(null);
      setGraphBuilding(false);
      return;
    }
    setGraphBuilding(true);
    const handle = setTimeout(() => {
      try {
        const data = buildGraph(notes, allContents);
        setRawGraphData(data);
      } catch {
        setRawGraphData(null);
      }
      setGraphBuilding(false);
    }, 0);
    return () => clearTimeout(handle);
  }, [notes, allContents]);

  const simulationRef = useRef<Simulation<SimulationNodeDatum, any> | null>(null);
  const animFrameRef = useRef<number>(0);
  const [tick, setTick] = useState(0);
  const [layoutResult, setLayoutResult] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      simulationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!rawGraphData) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    simulationRef.current?.stop();

    const data = rawGraphData;
    const folders = data.nodes.map(n => n.folder).filter(Boolean) as string[];
    const uniqueFolders = [...new Set(folders)].sort();
    const filtered = applyFilter(data, filter, uniqueFolders);
    const result = computeLayout(filtered, { ...layoutOptions, width: size.width, height: size.height });
    setLayoutResult({ nodes: result.nodes, edges: result.edges });
    simulationRef.current = result.simulation;
  }, [rawGraphData, filter, size, activeNote, layoutOptions]);

  // Tick loop
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim || tick === 0) return;

    let running = true;
    const loop = () => {
      if (!running) return;
      const energy = sim.alpha();
      if (energy < sim.alphaMin()) {
        sim.stop();
        running = false;
        return;
      }
      sim.tick();
      setLayoutResult(prev => prev ? { nodes: [...sim.nodes() as GraphNode[]], edges: prev.edges } : prev);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [tick]);

  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    const sim = simulationRef.current;
    if (!sim) return;
    const node = (sim.nodes() as any[]).find((n: any) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
      sim.alpha(0.3).restart();
      setTick(prev => prev + 1);
    }
  };

  const handleNodeDragEnd = (nodeId: string) => {
    const sim = simulationRef.current;
    if (!sim) return;
    const node = (sim.nodes() as any[]).find((n: any) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
      sim.alpha(0.1).restart();
      setTick(prev => prev + 1);
    }
  };

  const folders = useMemo(() => {
    if (!rawGraphData) return [];
    return [...new Set(rawGraphData.nodes.map(n => n.folder).filter(Boolean))].sort();
  }, [rawGraphData]);

  const totalNodes = rawGraphData?.nodes.length ?? 0;
  const visibleNodes = layoutResult?.nodes.length ?? 0;
  const visibleEdges = layoutResult?.edges.length ?? 0;

  return (
    <div className="graph-view">
      {/* Header */}
      <div className="graph-header">
        <div className="graph-header-left">
          <h3 className="graph-title">Graph View</h3>
          <span className="graph-node-count">{totalNodes} notes</span>
        </div>
        <div className="graph-header-actions">
          {/* Settings gear */}
          <div className="graph-settings-wrap" ref={settingsRef}>
            <button className={`btn-icon ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(v => !v)} title="Graph settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            {showSettings && (
              <div className="graph-settings-dropdown">
                {/* Tab row */}
                <div className="gs-chip-row" style={{ marginBottom: '6px' }}>
                  {(['filters', 'forces', 'display'] as const).map(tab => (
                    <button key={tab} className={`gs-chip ${settingsTab === tab ? 'active' : ''}`} onClick={() => setSettingsTab(tab)}>
                      {tab === 'filters' ? 'Filters' : tab === 'forces' ? 'Forces' : 'Display'}
                    </button>
                  ))}
                </div>

                {settingsTab === 'filters' && (
                  <>
                    <div className="gs-group">
                      <div className="gs-field-row">
                        <span className="gs-field-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
                        <input className="gs-input" type="text" placeholder="Filter nodes..." value={filter.searchQuery} onChange={e => setFilter({ ...filter, searchQuery: e.target.value })} />
                      </div>
                    </div>
                    <label className="gs-checkbox">
                      <input type="checkbox" checked={filter.hideOrphans} onChange={e => setFilter({ ...filter, hideOrphans: e.target.checked })} />
                      <span className="gs-check-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></span>
                      <span>Hide orphans</span>
                    </label>
                    <div className="gs-group">
                      <div className="gs-field-row">
                        <span className="gs-field-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>
                        <select className="gs-select" value={filter.folderPath} onChange={e => setFilter({ ...filter, folderPath: e.target.value })}>
                          <option value="">All folders</option>
                          {folders.map(f => (<option key={f} value={f}>{f}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="gs-group">
                      <div className="gs-slider-row">
                        <span className="gs-field-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
                        <span className="gs-slider-label">Min links</span>
                        <span className="gs-slider-value">{filter.minConnections}</span>
                      </div>
                      <input className="gs-range" type="range" min={0} max={20} value={filter.minConnections} onChange={e => setFilter({ ...filter, minConnections: Number(e.target.value) })} />
                    </div>
                  </>
                )}

                {settingsTab === 'forces' && (
                  <>
                    <div className="gs-group">
                      <div className="gs-slider-row">
                        <span className="gs-slider-label">Center force</span>
                        <span className="gs-slider-value">{layoutOptions.centerStrength.toFixed(2)}</span>
                      </div>
                      <input className="gs-range" type="range" min={0} max={1} step={0.01} value={layoutOptions.centerStrength} onChange={e => setLayoutOptions({ ...layoutOptions, centerStrength: Number(e.target.value) })} />
                    </div>
                    <div className="gs-group">
                      <div className="gs-slider-row">
                        <span className="gs-slider-label">Repel force</span>
                        <span className="gs-slider-value">{Math.abs(layoutOptions.chargeStrength)}</span>
                      </div>
                      <input className="gs-range" type="range" min={100} max={2000} step={10} value={Math.abs(layoutOptions.chargeStrength)} onChange={e => setLayoutOptions({ ...layoutOptions, chargeStrength: -Number(e.target.value) })} />
                    </div>
                    <div className="gs-group">
                      <div className="gs-slider-row">
                        <span className="gs-slider-label">Link force</span>
                        <span className="gs-slider-value">{layoutOptions.linkStrength.toFixed(2)}</span>
                      </div>
                      <input className="gs-range" type="range" min={0} max={1} step={0.01} value={layoutOptions.linkStrength} onChange={e => setLayoutOptions({ ...layoutOptions, linkStrength: Number(e.target.value) })} />
                    </div>
                    <div className="gs-group">
                      <div className="gs-slider-row">
                        <span className="gs-slider-label">Link distance</span>
                        <span className="gs-slider-value">{layoutOptions.linkDistance}</span>
                      </div>
                      <input className="gs-range" type="range" min={20} max={400} step={5} value={layoutOptions.linkDistance} onChange={e => setLayoutOptions({ ...layoutOptions, linkDistance: Number(e.target.value) })} />
                    </div>
                  </>
                )}

                {settingsTab === 'display' && (
                  <>
                    <div className="gs-group">
                      <div className="gs-slider-row">
                        <span className="gs-slider-label">Node size</span>
                        <span className="gs-slider-value">{filter.nodeScale.toFixed(1)}x</span>
                      </div>
                      <input className="gs-range" type="range" min={0.3} max={3} step={0.1} value={filter.nodeScale} onChange={e => setFilter({ ...filter, nodeScale: Number(e.target.value) })} />
                    </div>
                    <div className="gs-group">
                      <div className="gs-slider-row">
                        <span className="gs-slider-label">Link thickness</span>
                        <span className="gs-slider-value">{filter.linkThickness.toFixed(1)}x</span>
                      </div>
                      <input className="gs-range" type="range" min={0.3} max={4} step={0.1} value={filter.linkThickness} onChange={e => setFilter({ ...filter, linkThickness: Number(e.target.value) })} />
                    </div>
                    <label className="gs-checkbox">
                      <input type="checkbox" checked={filter.showArrows} onChange={e => setFilter({ ...filter, showArrows: e.target.checked })} />
                      <span className="gs-check-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></span>
                      <span>Show arrows</span>
                    </label>
                    <div className="gs-divider" style={{ marginTop: '6px' }} />
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
                  </>
                )}
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

      {/* Canvas */}
      <div className="graph-body" ref={containerRef}>
        <div className="graph-canvas-container">
          {graphBuilding || (notes.length > 0 && !rawGraphData) ? (
            <div className="graph-loading">
              <div className="graph-spinner" />
              <span>Building graph...</span>
            </div>
          ) : layoutResult && visibleNodes > 0 ? (
            <GraphCanvas nodes={layoutResult.nodes} edges={layoutResult.edges} onNodeClick={id => onNodeClick(id)} onNodeDrag={handleNodeDrag} onNodeDragEnd={handleNodeDragEnd} width={size.width} height={size.height} linkThickness={filter.linkThickness} showArrows={filter.showArrows} />
          ) : notes.length === 0 ? (
            <EmptyState
              icon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              }
              title="No notes yet"
              description="Create some notes first to see the graph."
            />
          ) : (
            <EmptyState
              icon={
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              }
              title="No connections found"
              description="Create [[wiki links]] between notes to see the graph."
            />
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
