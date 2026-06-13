import React, { useState, useEffect } from "react";
import {
  MarketplacePlugin, fetchMarketplace, installPlugin,
  uninstallPlugin, updatePlugin, isInstalled, needsUpdate, getInstalledVersion
} from "../plugins/marketplace";

interface MarketplaceModalProps {
  onClose: () => void;
}

export default function MarketplaceModal({ onClose }: MarketplaceModalProps) {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMarketplace()
      .then((data) => { setPlugins(data); setLoading(false); })
      .catch((err) => { setError(String(err)); setLoading(false); });
  }, []);

  const handleInstall = async (plugin: MarketplacePlugin) => {
    setActionId(plugin.id);
    const ok = await installPlugin(plugin);
    setActionId(null);
    if (!ok) alert(`Failed to install ${plugin.name}`);
  };

  const handleUpdate = async (plugin: MarketplacePlugin) => {
    setActionId(plugin.id);
    const ok = await updatePlugin(plugin);
    setActionId(null);
    if (!ok) alert(`Failed to update ${plugin.name}`);
  };

  const handleUninstall = async (plugin: MarketplacePlugin) => {
    setActionId(plugin.id);
    const ok = await uninstallPlugin(plugin.id);
    setActionId(null);
    if (!ok) alert(`Failed to uninstall ${plugin.name}`);
  };

  const filtered = search.trim()
    ? plugins.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : plugins;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Plugin Marketplace</h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <input
            className="command-palette-input"
            placeholder="Search plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: "var(--space-md)" }}
          />

          {loading && (
            <div className="marketplace-loading">
              <div className="marketplace-spinner" />
              <span>Loading plugins...</span>
            </div>
          )}

          {error && (
            <div className="marketplace-error">
              <span>&#9888;&#65039; Failed to load marketplace. Check your internet connection.</span>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="plugin-empty">
              <p>No plugins found.</p>
            </div>
          )}

          <div className="marketplace-grid">
            {filtered.map((plugin) => {
              const installed = isInstalled(plugin.id);
              const canUpdate = installed && needsUpdate(plugin.id, plugin.version);
              const localVersion = getInstalledVersion(plugin.id);
              const busy = actionId === plugin.id;

              return (
                <div key={plugin.id} className={`marketplace-card ${installed ? "installed" : ""}`}>
                  <div className="marketplace-card-header">
                    <div className="marketplace-card-info">
                      <div className="marketplace-card-name">
                        {plugin.name}
                        <span className="marketplace-card-version">v{plugin.version}</span>
                      </div>
                      <p className="marketplace-card-author">by {plugin.author}</p>
                    </div>
                    {installed && <span className="marketplace-installed-badge">Installed</span>}
                  </div>

                  <p className="marketplace-card-desc">{plugin.description}</p>

                  <div className="marketplace-card-tags">
                    {plugin.tags.map((tag) => (
                      <span key={tag} className="marketplace-tag">#{tag}</span>
                    ))}
                  </div>

                  <div className="marketplace-card-actions">
                    {!installed && (
                      <button
                        className="btn-secondary marketplace-install-btn"
                        onClick={() => handleInstall(plugin)}
                        disabled={busy}
                      >
                        {busy ? "Installing..." : "Install"}
                      </button>
                    )}
                    {installed && canUpdate && (
                      <button
                        className="btn-secondary marketplace-update-btn"
                        onClick={() => handleUpdate(plugin)}
                        disabled={busy}
                      >
                        {busy ? "Updating..." : `Update (${localVersion} → ${plugin.version})`}
                      </button>
                    )}
                    {installed && !canUpdate && (
                      <span className="marketplace-up-to-date">Up to date</span>
                    )}
                    {installed && (
                      <button
                        className="btn-secondary marketplace-uninstall-btn"
                        onClick={() => handleUninstall(plugin)}
                        disabled={busy}
                      >
                        {busy ? "Removing..." : "Uninstall"}
                      </button>
                    )}
                  </div>

                  {plugin.repoUrl && (
                    <a
                      className="marketplace-card-repo"
                      href={plugin.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Source
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <p className="settings-hint" style={{ marginTop: "var(--space-md)", textAlign: "center" }}>
            Plugins run as JavaScript with full app access. Only install from trusted sources.
          </p>
        </div>
      </div>
    </div>
  );
}
