import React, { useEffect, useState } from "react";
import type { VaultStats as VaultStatsData } from "../shared/ipc-contract";

interface VaultStatsProps {
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VaultStats({ onClose }: VaultStatsProps) {
  const [stats, setStats] = useState<VaultStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.electronAPI.getVaultStats().then((result) => {
      if (!result.ok) {
        setError(result.error.message);
      } else {
        setStats(result.value);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Vault Statistics</h2>
            <button className="btn-icon" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <p className="settings-hint">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Vault Statistics</h2>
            <button className="btn-icon" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <p className="settings-hint" style={{ color: "var(--danger)" }}>{error ?? "Failed to load stats."}</p>
          </div>
        </div>
      </div>
    );
  }

  const cards: { title: string; value: string; icon: React.ReactNode }[] = [
    {
      title: "Notes",
      value: String(stats.noteCount),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
    {
      title: "Folders",
      value: String(stats.folderCount),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      title: "Tags",
      value: String(stats.tagCount),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    },
    {
      title: "Wiki Links",
      value: String(stats.wikiLinkCount),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    },
    {
      title: "Orphans",
      value: String(stats.orphanCount),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    },
    {
      title: "Total Size",
      value: formatBytes(stats.totalSizeBytes),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    },
    {
      title: "Avg Note Size",
      value: formatBytes(stats.averageNoteSize),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2 className="modal-title">Vault Statistics</h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "var(--space-md)",
          }}>
            {cards.map((card) => (
              <div key={card.title} style={{
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
                textAlign: "center",
                border: "1px solid var(--border)",
              }}>
                <div style={{ color: "var(--text-muted)", marginBottom: "var(--space-xs)" }}>{card.icon}</div>
                <div style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--accent)", marginBottom: "var(--space-xs)" }}>{card.value}</div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>{card.title}</div>
              </div>
            ))}
          </div>

          {stats.recentlyModified.length > 0 && (
            <div style={{ marginTop: "var(--space-lg)" }}>
              <div className="settings-label" style={{ marginBottom: "var(--space-sm)" }}>Recently Modified</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                {stats.recentlyModified.map((n) => (
                  <div key={n.path} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-xs) var(--space-sm)",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--font-size-sm)",
                  }}>
                    <span style={{ color: "var(--text-primary)" }}>{n.path.replace(/\.md$/, "").split("/").pop()}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "var(--font-size-xs)" }}>
                      {new Date(n.mtime).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
