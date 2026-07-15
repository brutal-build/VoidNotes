import { describe, expect, it, vi } from 'vitest';
import { buildGraph, computeLayout, limitGraph } from '../graph/graph-engine';

describe('graph reliability', () => {
  it('builds deterministic positions independent of input order', () => {
    const allContents = new Map<string, string>([['a.md', '[[b.md]]'], ['b.md', '']]);
    const first = buildGraph(['b.md', 'a.md'], allContents);
    const second = buildGraph(['a.md', 'b.md'], allContents);
    const positions = (nodes: typeof first.nodes) => nodes.map(({ id, x, y }) => ({ id, x, y }));
    expect(positions(first.nodes)).toEqual(positions(second.nodes));
    expect(first.nodes.map(node => node.id)).toEqual(['a.md', 'b.md']);
  });

  it('limits large graphs deterministically and keeps only valid edges', () => {
    const nodes = Array.from({ length: 5 }, (_, index) => ({
      id: `${index}.md`, label: `${index}`, path: `${index}.md`, size: 4,
      color: '#fff', folder: '', tags: [], degree: index,
    }));
    const edges = [
      { source: '4.md', target: '3.md' },
      { source: '4.md', target: '0.md' },
      { source: '2.md', target: '1.md' },
    ];
    const limited = limitGraph({ nodes, edges }, 3);
    expect(limited.nodes.map(node => node.id)).toEqual(['4.md', '3.md', '2.md']);
    expect(limited.edges).toEqual([{ source: '4.md', target: '3.md' }]);
  });

  it('stops the d3 simulation after synchronous layout', () => {
    const stop = vi.fn();
    const simulation = { force: vi.fn(), stop, tick: vi.fn() };
    simulation.force.mockReturnValue(simulation);
    stop.mockReturnValue(simulation);
    computeLayout({ nodes: [], edges: [] }, {}, () => simulation as never);
    expect(stop).toHaveBeenCalledTimes(2);
  });
});
