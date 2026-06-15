import React, { useState } from "react";
import { APP_VERSION } from "../plugins/updater";

export type ThemeName = "obsidian" | "light" | "dracula" | "nord" | "solarized";

const THEMES: { name: ThemeName; label: string; colors: { bg: string; accent: string; text: string } }[] = [
  { name: "obsidian", label: "Obsidian", colors: { bg: "#1e1e1e", accent: "#8a70d6", text: "#e0e0e0" } },
  { name: "light", label: "Light", colors: { bg: "#ffffff", accent: "#7c5cbf", text: "#1a1a1a" } },
  { name: "dracula", label: "Dracula", colors: { bg: "#282a36", accent: "#bd93f9", text: "#f8f8f2" } },
  { name: "nord", label: "Nord", colors: { bg: "#2e3440", accent: "#88c0d0", text: "#eceff4" } },
  { name: "solarized", label: "Solarized", colors: { bg: "#002b36", accent: "#268bd2", text: "#93a1a1" } },
];

interface SettingsProps {
  onClose: () => void;
  onSwitchVault: () => void;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  vaultPath: string | null;
  vimMode: boolean;
  onVimModeChange: (v: boolean) => void;
}

export default function Settings({ onClose, onSwitchVault, theme, onThemeChange, vaultPath, vimMode, onVimModeChange }: SettingsProps) {

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <div className="settings-label">Theme</div>
            <p className="settings-hint">Choose a color theme for the editor.</p>
            <div className="theme-grid">
              {THEMES.map((t) => (
                <div
                  key={t.name}
                  className={`theme-option ${theme === t.name ? "active" : ""}`}
                  onClick={() => onThemeChange(t.name)}
                >
                  <div className="theme-preview">
                    <div className="theme-preview-bg" style={{ background: t.colors.bg }} />
                    <div className="theme-preview-accent" style={{ background: t.colors.accent }} />
                    <div className="theme-preview-text" style={{ background: t.colors.text }} />
                  </div>
                  <span className="theme-name">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Vault</div>
            {vaultPath && (
              <p className="vault-path">{vaultPath}</p>
            )}
            <p className="settings-hint">Change the folder where your notes are stored.</p>
            <button className="btn-secondary" onClick={onSwitchVault}>
              Switch Vault Folder
            </button>
          </div>

          <div className="settings-section">
            <div className="settings-label">Editor</div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Vim Keybindings</span>
              <button
                className={`toggle-btn ${vimMode ? "active" : ""}`}
                onClick={() => onVimModeChange(!vimMode)}
              >
                <div className="toggle-knob" />
              </button>
            </div>
            <p className="settings-hint">Use Vim-style modal editing (Normal, Insert, Visual modes).</p>
          </div>


          <div className="settings-section">
            <div className="settings-label">Keyboard Shortcuts</div>
            <div className="shortcuts-list">
              <div className="shortcut-row"><span>Save</span><kbd>Ctrl+S</kbd></div>
              <div className="shortcut-row"><span>Preview</span><kbd>Ctrl+E</kbd></div>
              <div className="shortcut-row"><span>Split View</span><kbd>Ctrl+Shift+E</kbd></div>
              <div className="shortcut-row"><span>Search / Commands</span><kbd>Ctrl+P</kbd></div>
              <div className="shortcut-row"><span>New Note</span><kbd>Ctrl+N</kbd></div>
              <div className="shortcut-row"><span>Settings</span><kbd>Ctrl+,</kbd></div>
              <div className="shortcut-row"><span>Help</span><kbd>F1</kbd></div>
              <div className="shortcut-row"><span>Focus Mode</span><kbd>F9</kbd></div>
              <div className="shortcut-row"><span>Daily Note</span><kbd>Ctrl+Shift+N</kbd></div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">About</div>
            <p className="settings-hint">
              Void Notes v{APP_VERSION} — minimalistic<br />
              A minimalist second-brain notepad.<br />
              Built with Electron + React + CodeMirror 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
