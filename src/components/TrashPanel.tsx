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

  const handleRestore = useCallback(async (id: string) => {
    const result = await window.electronAPI.restoreTrash(id);
    if (!result.ok) {
      setError(`Failed to restore: ${result.error.message}`);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    onRestore?.();
  }, [onRestore]);

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
    if (expandedId === id) setExpandedId(null);
  }, [deleteId, expandedId]);

  const noteName = (path: string) => path.split("/").pop()?.replace(/\.md$/, "") || path;

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
          {entries.map((entry) => (
            <div key={entry.id} className={`trash-item ${expandedId === entry.id ? "expanded" : ""}`}>
              <div className="trash-item-main">
                <div className="trash-item-info" onClick={() => togglePreview(entry.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") togglePreview(entry.id); }}>
                  <svg className="trash-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points={expandedId === entry.id ? "18 15 12 9 6 15" : "9 18 15 12 9 6"} />
                  </svg>
                  <span className="trash-item-name">{noteName(entry.originalPath)}</span>
                  <span className="trash-item-path">{entry.originalPath}</span>
                  <span className="trash-item-date">{formatDate(entry.deletedAt)}</span>
                </div>
                <div className="trash-item-actions">
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
    </div>
  );
}
