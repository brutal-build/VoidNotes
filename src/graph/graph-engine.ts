/**
 * graph-engine.ts
 *
 * Force-directed graph engine for Void Notes.
 * Uses d3-force for physics simulation.
 */

import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, SimulationNodeDatum, Simulation } from 'd3-force';
import { extractWikiLinks } from '../plugins/wiki-links-utils';
import { extractTags } from '../plugins/tag-utils';
import type { GraphNode, GraphEdge, GraphData, GraphFilter, GraphLayoutOptions, ColorMode, SizeMode } from '../types';

// Re-export for backward compatibility
export type { GraphNode, GraphEdge, GraphData, GraphFilter, GraphLayoutOptions, ColorMode, SizeMode };

export const DEFAULT_FILTER: GraphFilter = {
  searchQuery: '',
  hideOrphans: false,
  folderPath: '',
  minConnections: 0,
  showTags: [],
  colorMode: 'default',
  sizeMode: 'degree',
  nodeScale: 1,
  linkThickness: 1,
  showArrows: false,
};

export const DEFAULT_LAYOUT_OPTIONS: GraphLayoutOptions = {
  width: 800,
  height: 600,
  chargeStrength: -500,
  linkDistance: 120,
  linkStrength: 0.3,
  centerStrength: 0.15,
  collideRadius: 15,
};

// ─── Color palettes ─────────────────────────────────────

const COLORS_DEFAULT = [
  '#61afef', '#e06c75', '#98c379', '#e5c07b',
  '#c678dd', '#56b6c2', '#d19a66', '#abb2bf',
];

const FOLDER_COLORS = [
  '#e06c75', // red
  '#61afef', // blue
  '#98c379', // green
  '#e5c07b', // yellow
  '#c678dd', // purple
  '#56b6c2', // cyan
];

const DEGREE_COLORS = ['#61afef', '#abb2bf'];

// ─── Build graph ────────────────────────────────────────

function buildLinkMap(noteMap: Map<string, string>): Map<string, Set<string>> {
  const linkMap = new Map<string, Set<string>>();
  for (const [note, content] of noteMap) {
    if (!linkMap.has(note)) linkMap.set(note, new Set());
    const links = extractWikiLinks(content, true);
    for (const target of links) {
      if (noteMap.has(target)) linkMap.get(note)!.add(target);
    }
  }
  return linkMap;
}

function computeDegrees(noteMap: Map<string, string>, linkMap: Map<string, Set<string>>): Map<string, number> {
  const degree = new Map<string, number>();
  for (const [note] of noteMap) {
    let d = linkMap.get(note)?.size || 0;
    for (const [, targets] of linkMap) {
      if (targets.has(note)) d++;
    }
    degree.set(note, d);
  }
  return degree;
}

export function buildGraph(
  notes: string[],
  allContents: Map<string, string>
): GraphData {
  const sortedNotes = [...new Set(notes)].sort((a, b) => a.localeCompare(b));
  const noteMap = new Map<string, string>();
  for (const note of sortedNotes) {
    noteMap.set(note, allContents.get(note) ?? "");
  }
  const linkMap = buildLinkMap(noteMap);
  const degrees = computeDegrees(noteMap, linkMap);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const [note] of noteMap) {
    const deg = degrees.get(note) || 0;
    const folder = note.includes('/') ? note.split('/').slice(0, -1).join('/') : '';
    const content = noteMap.get(note) || '';
    const tags = Array.from(new Set(extractTags(content).map(t => t.toLowerCase())));
    const colorIndex = Math.abs(hashString(note)) % COLORS_DEFAULT.length;

    nodes.push({
      id: note,
      label: note.replace(/\.md$/, '').split('/').pop() || note,
      path: note,
      size: Math.max(4, Math.min(18, deg * 1.5 + 4)),
      color: COLORS_DEFAULT[colorIndex],
      folder,
      tags,
      degree: deg,
      x: seededCoordinate(note, 0, 800),
      y: seededCoordinate(note, 1, 600),
      vx: 0,
      vy: 0,
    });
  }

  for (const [source, targets] of linkMap) {
    for (const target of targets) {
      const key = [source, target].sort().join('::');
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push({ source, target });
    }
  }

  // Compute cluster IDs using simple community detection
  assignClusters(nodes, edges);

  return { nodes, edges };
}

// ─── Simple cluster detection ───────────────────────────

function assignClusters(nodes: GraphNode[], edges: GraphEdge[]): void {
  const adj = new Map<string, string[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    const src = e.source as string;
    const tgt = e.target as string;
    const s = typeof src === 'object' ? (src as any).id : src;
    const t = typeof tgt === 'object' ? (tgt as any).id : tgt;
    adj.get(s)?.push(t);
    adj.get(t)?.push(s);
  }

  let clusterId = 0;
  const visited = new Set<string>();
  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    const queue = [n.id];
    visited.add(n.id);
    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = nodes.find(nd => nd.id === id);
      if (node) (node as any).cluster = clusterId;
      for (const neighbor of adj.get(id) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    clusterId++;
  }
}

// ─── Simulation ─────────────────────────────────────────

export interface LayoutResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  simulation: Simulation<SimulationNodeDatum, any>;
}

export function computeLayout(
  graphData: GraphData,
  options: Partial<GraphLayoutOptions> = {},
  simulationFactory: typeof forceSimulation = forceSimulation
): LayoutResult {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const nodes = graphData.nodes.map(n => ({ ...n }));
  const edges = graphData.edges.map(e => ({ ...e }));

  const simulation = simulationFactory(nodes as SimulationNodeDatum[])
    .force('link', forceLink<any, any>(edges)
      .id((d: any) => d.id)
      .distance(opts.linkDistance!)
      .strength(opts.linkStrength!)
    )
    .force('charge', forceManyBody().strength(opts.chargeStrength!))
    .force('center', forceCenter(opts.width / 2, opts.height / 2).strength(opts.centerStrength!))
    .force('collide', forceCollide(opts.collideRadius!))
    .stop();

  const totalEnergyThreshold = 0.05;
  for (let i = 0; i < 500; i++) {
    simulation.tick();
    const energy = nodes.reduce((sum, n) => sum + Math.abs(n.vx || 0) + Math.abs(n.vy || 0), 0);
    if (energy < totalEnergyThreshold) break;
  }

  simulation.stop();
  return { nodes, edges, simulation };
}

export function limitGraph(graphData: GraphData, maxNodes = 2000): GraphData {
  if (graphData.nodes.length <= maxNodes) return graphData;
  const nodes = [...graphData.nodes]
    .sort((a, b) => b.degree - a.degree || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, maxNodes));
  const visible = new Set(nodes.map(node => node.id));
  const edges = graphData.edges.filter(edge => {
    const source = typeof edge.source === 'object' ? (edge.source as GraphNode).id : edge.source;
    const target = typeof edge.target === 'object' ? (edge.target as GraphNode).id : edge.target;
    return visible.has(source) && visible.has(target);
  });
  return { nodes, edges };
}

// ─── Color modes ────────────────────────────────────────

export function applyColorMode(
  nodes: GraphNode[],
  mode: ColorMode,
  folders: string[]
): GraphNode[] {
  return nodes.map(n => {
    let color = n.color;
    switch (mode) {
      case 'folder': {
        if (!n.folder) { color = '#444'; break; }
        const idx = folders.indexOf(n.folder);
        color = FOLDER_COLORS[idx % FOLDER_COLORS.length];
        break;
      }
      case 'degree': {
        const t = Math.min(n.degree / 10, 1);
        color = lerpColor(DEGREE_COLORS[0], DEGREE_COLORS[1], t);
        break;
      }
      default:
        color = n.color;
    }
    return { ...n, color };
  });
}

// ─── Size mode ──────────────────────────────────────────

export function applySizeMode(
  nodes: GraphNode[],
  mode: SizeMode,
  scale = 1
): GraphNode[] {
  return nodes.map(n => ({
    ...n,
    size: (mode === 'degree' ? Math.max(4, Math.min(18, n.degree * 1.5 + 4)) : 6) * scale,
  }));
}

// ─── Filter ─────────────────────────────────────────────

export function applyFilter(
  graphData: GraphData,
  filter: GraphFilter,
  allFolders: string[]
): GraphData {
  let nodes = [...graphData.nodes];
  let edges = [...graphData.edges];

  if (filter.hideOrphans) {
    nodes = nodes.filter(n => n.degree > 0);
  }

  if (filter.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    nodes = nodes.filter(n =>
      n.label.toLowerCase().includes(q) ||
      n.path.toLowerCase().includes(q)
    );
  }

  if (filter.folderPath) {
    nodes = nodes.filter(n => n.folder === filter.folderPath || n.folder.startsWith(filter.folderPath + '/'));
  }

  if (filter.minConnections > 0) {
    nodes = nodes.filter(n => n.degree >= filter.minConnections);
  }

  if (filter.showTags.length > 0) {
    nodes = nodes.filter(n => n.tags.some(t => filter.showTags.includes(t)));
  }

  // Apply color and size modes
  nodes = applyColorMode(nodes, filter.colorMode, allFolders);
  nodes = applySizeMode(nodes, filter.sizeMode, filter.nodeScale);

  const visibleIds = new Set(nodes.map(n => n.id));
  edges = edges.filter(e => {
    const sourceId = typeof e.source === 'object' ? (e.source as any).id : e.source;
    const targetId = typeof e.target === 'object' ? (e.target as any).id : e.target;
    return visibleIds.has(sourceId) && visibleIds.has(targetId);
  });

  return { nodes, edges };
}

// ─── Helpers ────────────────────────────────────────────

export function getNeighbors(nodeId: string, edges: GraphEdge[]): Set<string> {
  const neighbors = new Set<string>();
  for (const edge of edges) {
    const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
    const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;
    if (sourceId === nodeId) neighbors.add(targetId);
    if (targetId === nodeId) neighbors.add(sourceId);
  }
  return neighbors;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function seededCoordinate(id: string, axis: number, extent: number): number {
  return (Math.abs(hashString(`${axis}:${id}`)) % 10000) / 10000 * extent;
}

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}
