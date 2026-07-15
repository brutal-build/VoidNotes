import React, { useState, useEffect, useCallback } from "react";
import type { TrashEntry } from "../shared/ipc-contract";
import { ConfirmDialog } from "./ui/ConfirmDialog";

interface TrashPanelProps {
  onClose: () => void;
  onRestore?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TrashPanel({ onClose, onRestore }: TrashPanelProps) {
  const [entries, setEntries] = useState<TrashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewContents, setPreviewContents] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await window.electronAPI.listTrash();
    if (!result.ok) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    setEntries(result.value);
    setSelectedIds(new Set());
    setLoading(false);
  }, []);

  useEffect(() => { loadTrash(); }, [loadTrash]);

  const togglePreview = useCallback(async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!previewContents[id]) {
      const result = await window.electronAPI.loadTrash(id);
      if (result.ok) {
        setPreviewContents((prev) => ({ ...prev, [id]: result.value }));
      }
    }
  }, [expandedId, previewContents]);

  const toggleSelect = useCallback((id: string, index: number, e: React.MouseEvent) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (e.shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, index);
        const end = Math.max(lastClickedIndex, index);
        for (let i = start; i <= end; i++) {
          next.add(entries[i].id);
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        if (next.has(id) && next.size === 1) next.delete(id);
        else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
    setLastClickedIndex(index);
  }, [entries, lastClickedIndex]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === entries.length) return new Set();
      return new Set(entries.map((e) => e.id));
    });
    setLastClickedIndex(null);
  }, [entries]);

  const toggleSelectDirect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRestore = useCallback(async (id: string) => {
    const result = await window.electronAPI.restoreTrash(id);
    if (!result.ok) {
      setError(`Failed to restore: ${result.error.message}`);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    onRestore?.();
  }, [onRestore]);

  const handleRestoreSelected = useCallback(async () => {
    const ids = [...selectedIds];
    let restored = 0;
    for (const id of ids) {
      const result = await window.electronAPI.restoreTrash(id);
      if (result.ok) restored++;
    }
    setEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    setExpandedId(null);
    if (restored < ids.length) setError(`Restored ${restored} of ${ids.length} notes.`);
    onRestore?.();
  }, [selectedIds, onRestore]);

  const confirmBulkDelete = useCallback(() => {
    setDeleteIds([...selectedIds]);
  }, [selectedIds]);

  const handleBulkDeletePermanently = useCallback(async () => {
    if (!deleteIds) return;
    const ids = deleteIds;
    setDeleteIds(null);
    let deleted = 0;
    for (const id of ids) {
      const result = await window.electronAPI.deleteTrash(id);
      if (result.ok) deleted++;
    }
    setEntries((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelectedIds(new Set());
    if (expandedId && ids.includes(expandedId)) setExpandedId(null);
    if (deleted < ids.length) setError(`Deleted ${deleted} of ${ids.length} notes.`);
  }, [deleteIds, expandedId]);

  const handleDeletePermanently = useCallback(async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    const result = await window.electronAPI.deleteTrash(id);
    if (!result.ok) {
      setError(`Failed to delete: ${result.error.message}`);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (expandedId === id) setExpandedId(null);
  }, [deleteId, expandedId]);

  const noteName = (path: string) => path.split("/").pop()?.replace(/\.md$/, "") || path;

  const bulkNoteName = deleteIds ? deleteIds.map((id) => noteName(entries.find((e) => e.id === id)?.originalPath || "")).join(", ") : "";
  const allSelected = entries.length > 0 && selectedIds.size === entries.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Trash</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          {loading && <div className="trash-status">Loading...</div>}
          {error && <div className="trash-error" role="alert">{error}</div>}
          {!loading && !error && entries.length === 0 && (
            <div className="trash-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <p>Trash is empty</p>
            </div>
          )}
          {entries.length > 0 && (
            <div className="trash-toolbar">
              <label className="trash-select-all-label">
                <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleSelectAll} />
                {someSelected ? `${selectedIds.size} selected` : "Select all"}
              </label>
              {someSelected && (
                <div className="trash-bulk-actions">
                  <button className="trash-btn trash-btn-restore" onClick={handleRestoreSelected}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                    Restore ({selectedIds.size})
                  </button>
                  <button className="trash-btn trash-btn-delete" onClick={confirmBulkDelete}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete ({selectedIds.size})
                  </button>
                </div>
              )}
            </div>
          )}
          {entries.map((entry, idx) => (
            <div key={entry.id} className={`trash-item ${expandedId === entry.id ? "expanded" : ""} ${selectedIds.has(entry.id) ? "selected" : ""}`}>
              <div className="trash-item-main">
                <div className="trash-item-check">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(entry.id)}
                    readOnly
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectDirect(entry.id);
                    }}
                    aria-label={`Select ${noteName(entry.originalPath)}`}
                  />
                </div>
                <div
                  className="trash-item-info"
                  onClick={(e) => { toggleSelect(entry.id, idx, e); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { toggleSelect(entry.id, idx, e as unknown as React.MouseEvent); } }}
                >
                  <svg className="trash-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points={expandedId === entry.id ? "18 15 12 9 6 15" : "9 18 15 12 9 6"} />
                  </svg>
                  <span className="trash-item-name">{noteName(entry.originalPath)}</span>
                  <span className="trash-item-path">{entry.originalPath}</span>
                  <span className="trash-item-date">{formatDate(entry.deletedAt)}</span>
                </div>
                <div className="trash-item-actions">
                  <button className="trash-btn-expand" onClick={() => togglePreview(entry.id)} title="Preview">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </button>
                  <button className="trash-btn trash-btn-restore" onClick={() => handleRestore(entry.id)} title="Restore note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                    Restore
                  </button>
                  <button className="trash-btn trash-btn-delete" onClick={() => setDeleteId(entry.id)} title="Delete permanently">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
              {expandedId === entry.id && (
                <div className="trash-preview">
                  {previewContents[entry.id] !== undefined ? (
                    <pre className="trash-preview-content">{previewContents[entry.id].slice(0, 500)}{previewContents[entry.id].length > 500 && "\u2026"}</pre>
                  ) : (
                    <div className="trash-preview-loading">Loading preview...</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Permanently"
        message={`"${deleteId ? noteName(entries.find((e) => e.id === deleteId)?.originalPath || "") : ""}" will be permanently deleted. This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete Permanently"
        onConfirm={handleDeletePermanently}
        onCancel={() => setDeleteId(null)}
      />
      <ConfirmDialog
        open={deleteIds !== null}
        title="Delete Permanently"
        message={`${deleteIds?.length || 0} notes will be permanently deleted. This cannot be undone.\n\n${bulkNoteName}`}
        variant="destructive"
        confirmLabel="Delete All Permanently"
        onConfirm={handleBulkDeletePermanently}
        onCancel={() => setDeleteIds(null)}
      />
    </div>
  );
}
