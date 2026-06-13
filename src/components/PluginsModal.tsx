import React, { useState } from "react";
import { getAllPluginManifests, setPluginEnabled } from "../plugins/pluginLoader";
import { pluginSystem } from "../plugins/pluginSystem";
import MarketplaceModal from "./MarketplaceModal";

interface PluginsModalProps {
  onClose: () => void;
}

export default function PluginsModal({ onClose }: PluginsModalProps) {
  const [pluginStates, setPluginStates] = useState(() => getAllPluginManifests());
  const [acceptedRisk, setAcceptedRisk] = useState(() => localStorage.getItem("void-plugins-risk-accepted") === "true");
  const [showMarketplace, setShowMarketplace] = useState(false);

  const handleToggle = (id: string, enabled: boolean) => {
    setPluginEnabled(id, enabled);
    setPluginStates(getAllPluginManifests());
  };

  const handleAcceptRisk = () => {
    setAcceptedRisk(true);
    localStorage.setItem("void-plugins-risk-accepted", "true");
  };

  const commands = pluginSystem.getCommandRegistry().getAll();

  if (showMarketplace) {
    return <MarketplaceModal onClose={() => setShowMarketplace(false)} />;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Plugins</h2>
          <div className="modal-header-actions">
            <button className="btn-secondary marketplace-btn" onClick={() => setShowMarketplace(true)}>
              &#127979; Marketplace
            </button>
            <button className="btn-icon" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="modal-body">
          {!acceptedRisk ? (
            <div className="plugin-security-warning">
              <div className="plugin-security-icon">&#9888;&#65039;</div>
              <h3>Security Warning</h3>
              <p>
                User plugins are <strong>JavaScript code</strong> that runs with full access to the application and your files.
                Plugins can read, modify, or delete any file in your vault, access the network, and execute system commands.
              </p>
              <p>
                <strong>Only install plugins from sources you trust.</strong> Malicious plugins can steal data, install malware, or damage your system.
              </p>
              <button className="btn-secondary plugin-accept-btn" onClick={handleAcceptRisk}>
                I understand the risks — show plugins
              </button>
            </div>
          ) : (
            <>
              <div className="plugins-section">
                <div className="plugins-section-title">Installed Plugins</div>
                <p className="settings-hint">
                  Manage your plugins. Changes require restart.
                  <span className="plugin-risk-badge">User plugins can contain unsafe code</span>
                </p>
                <div className="plugins-list">
                  {pluginStates.map(({ plugin, enabled }) => {
                    const pluginCommands = commands.filter((c) => c.id.startsWith(plugin.manifest.id));
                    return (
                      <div key={plugin.manifest.id} className={`plugin-card ${enabled ? "" : "disabled"}`}>
                        <div className="plugin-card-header">
                          <div className="plugin-card-info">
                            <div className="plugin-card-name">
                              {plugin.manifest.name}
                              <span className="plugin-card-version">v{plugin.manifest.version}</span>
                            </div>
                            {plugin.manifest.description && (
                              <p className="plugin-card-desc">{plugin.manifest.description}</p>
                            )}
                          </div>
                          <button
                            className={`toggle-btn ${enabled ? "active" : ""}`}
                            onClick={() => handleToggle(plugin.manifest.id, !enabled)}
                          >
                            <div className="toggle-knob" />
                          </button>
                        </div>
                        {pluginCommands.length > 0 && (
                          <div className="plugin-card-commands">
                            <span className="plugin-card-commands-label">Commands:</span>
                            {pluginCommands.map((cmd) => (
                              <span key={cmd.id} className="plugin-command-badge">
                                {cmd.icon} {cmd.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {pluginStates.length === 0 && (
                    <div className="plugin-empty">
                      <p>No plugins installed.</p>
                      <p className="settings-hint">
                        Drop <code>.js</code> plugin files into <code>.plugins/</code> folder in your vault, or browse the <strong>Marketplace</strong>.
                      </p>
                      <button className="btn-secondary marketplace-btn" onClick={() => setShowMarketplace(true)}>
                        &#127979; Browse Marketplace
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="plugins-section">
                <div className="plugins-section-title">How to Create Plugins</div>
                <div className="plugin-help">
                  <p>Create a <code>.js</code> file in <code>.plugins/</code> folder in your vault. See the full documentation on GitHub.</p>
                  <pre className="help-code">{`export default {
  manifest: {
    id: "my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    description: "Does something cool",
    main: "inline"
  },
  onInit(api) {
    api.commands.register({
      id: "my:hello",
      title: "Say Hello",
      icon: "\\u{1F44B}",
      action: () => alert("Hello!")
    });
  }
};`}</pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
