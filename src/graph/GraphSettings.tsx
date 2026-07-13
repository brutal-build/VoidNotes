/**
 * GraphSettings.tsx
 *
 * Compact flyout panel for graph filtering and appearance.
 */

import React from 'react';
import { GraphFilter, ColorMode, SizeMode } from './graph-engine';

interface GraphSettingsProps {
  filter: GraphFilter;
  onChange: (filter: GraphFilter) => void;
  onResetLayout: () => void;
  folders: string[];
}

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);
const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IconColor = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/>
  </svg>
);
const IconSize = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

export default function GraphSettings({ filter, onChange, onResetLayout, folders }: GraphSettingsProps) {
  const update = (partial: Partial<GraphFilter>) => onChange({ ...filter, ...partial });

  return (
    <div className="graph-settings">
      {/* Title row */}
      <div className="gs-title-row">
        <span className="gs-title-text">Filters</span>
        <button className="gs-btn-icon" onClick={onResetLayout} title="Reset layout">
          <IconRefresh />
        </button>
      </div>

      {/* Search */}
      <div className="gs-group">
        <div className="gs-field-row">
          <span className="gs-field-icon"><IconSearch /></span>
          <input className="gs-input" type="text" placeholder="Filter nodes..." value={filter.searchQuery}
            onChange={e => update({ searchQuery: e.target.value })} />
        </div>
      </div>

      {/* Hide orphans */}
      <label className="gs-checkbox">
        <input type="checkbox" checked={filter.hideOrphans} onChange={e => update({ hideOrphans: e.target.checked })} />
        <span className="gs-check-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></span>
        <span>Hide unconnected</span>
      </label>

      {/* Folder filter */}
      <div className="gs-group">
        <div className="gs-field-row">
          <span className="gs-field-icon"><IconFolder /></span>
          <select className="gs-select" value={filter.folderPath} onChange={e => update({ folderPath: e.target.value })}>
            <option value="">All folders</option>
            {folders.map(f => (<option key={f} value={f}>{f}</option>))}
          </select>
        </div>
      </div>

      {/* Min connections */}
      <div className="gs-group">
        <div className="gs-slider-row">
          <span className="gs-field-icon"><IconLink /></span>
          <span className="gs-slider-label">Min connections</span>
          <span className="gs-slider-value">{filter.minConnections}</span>
        </div>
        <input className="gs-range" type="range" min={0} max={20} value={filter.minConnections}
          onChange={e => update({ minConnections: Number(e.target.value) })} />
      </div>

      {/* Divider */}
      <div className="gs-divider" />

      {/* Color mode */}
      <div className="gs-group">
        <div className="gs-field-row">
          <span className="gs-field-icon"><IconColor /></span>
          <span className="gs-select-label">Color by</span>
        </div>
        <div className="gs-chip-row">
          {(['default', 'folder', 'degree'] as ColorMode[]).map(mode => (
            <button key={mode} className={`gs-chip ${filter.colorMode === mode ? 'active' : ''}`}
              onClick={() => update({ colorMode: mode })}>
              {mode === 'default' ? 'Hash' : mode === 'folder' ? 'Folder' : 'Degree'}
            </button>
          ))}
        </div>
      </div>

      {/* Size mode */}
      <div className="gs-group">
        <div className="gs-field-row">
          <span className="gs-field-icon"><IconSize /></span>
          <span className="gs-select-label">Node size</span>
        </div>
        <div className="gs-chip-row">
          {(['degree', 'fixed'] as SizeMode[]).map(mode => (
            <button key={mode} className={`gs-chip ${filter.sizeMode === mode ? 'active' : ''}`}
              onClick={() => update({ sizeMode: mode })}>
              {mode === 'degree' ? 'By degree' : 'Fixed'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
