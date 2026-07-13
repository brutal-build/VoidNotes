import React from "react";
import { APP_VERSION } from "../plugins/updater";
import type { ThemeName } from "../types";

const THEMES: { name: ThemeName; label: string; colors: { bg: string; accent: string; text: string } }[] = [
  { name: "obsidian", label: "Obsidian", colors: { bg: "#1e1e1e", accent: "#8a70d6", text: "#e0e0e0" } },
  { name: "light", label: "Light", colors: { bg: "#ffffff", accent: "#7c5cbf", text: "#1a1a1a" } },
  { name: "dracula", label: "Dracula", colors: { bg: "#282a36", accent: "#bd93f9", text: "#f8f8f2" } },
  { name: "nord", label: "Nord", colors: { bg: "#2e3440", accent: "#88c0d0", text: "#eceff4" } },
  { name: "solarized", label: "Solarized", colors: { bg: "#002b36", accent: "#268bd2", text: "#93a1a1" } },
  { name: "macos", label: "macOS", colors: { bg: "#1a1a1a", accent: "#007AFF", text: "#e0e0e0" } },
];

const FONTS = [
  { value: "Inter, Segoe UI, system-ui, sans-serif", label: "System (Inter)" },
  { value: "Cascadia Code, Fira Code, JetBrains Mono, Consolas, monospace", label: "Monospace (Cascadia Code)" },
  { value: "Georgia, Times New Roman, serif", label: "Serif (Georgia)" },
  { value: "Arial, Helvetica, sans-serif", label: "Sans-serif (Arial)" },
];

interface SettingsProps {
  onClose: () => void;
  onSwitchVault: () => void;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  vaultPath: string | null;
  vimMode: boolean;
  onVimModeChange: (v: boolean) => void;
  readableLineLength: boolean;
  onReadableLineLengthChange: (v: boolean) => void;
  editorFont: string;
  onEditorFontChange: (font: string) => void;
  spellcheck: boolean;
  onSpellcheckChange: (v: boolean) => void;
}

export default function Settings({
  onClose,
  onSwitchVault,
  theme,
  onThemeChange,
  vaultPath,
  vimMode,
  onVimModeChange,
  readableLineLength,
  onReadableLineLengthChange,
  editorFont,
  onEditorFontChange,
  spellcheck,
  onSpellcheckChange,
}: SettingsProps) {
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
            <div className="settings-label">Editor</div>
            <div className="settings-toggle-row">
              <span className="settings-toggle-label">Vim Keybindings</span>
              <button className={`toggle-btn ${vimMode ? "active" : ""}`} onClick={() => onVimModeChange(!vimMode)}>
                <div className="toggle-knob" />
              </button>
            </div>
            <p className="settings-hint">Use Vim-style modal editing (Normal, Insert, Visual modes).</p>

            <div className="settings-toggle-row" style={{ marginTop: "var(--space-md)" }}>
              <span className="settings-toggle-label">Readable Line Length</span>
              <button className={`toggle-btn ${readableLineLength ? "active" : ""}`} onClick={() => onReadableLineLengthChange(!readableLineLength)}>
                <div className="toggle-knob" />
              </button>
            </div>
            <p className="settings-hint">Limits line width to 80 characters for easier reading.</p>

            <div style={{ marginTop: "var(--space-md)" }}>
              <div className="settings-label">Editor Font</div>
              <p className="settings-hint">Choose the font for the editor.</p>
              <select
                value={editorFont}
                onChange={(e) => onEditorFontChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-sm) var(--space-md)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "var(--font-ui)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="settings-toggle-row" style={{ marginTop: "var(--space-md)" }}>
              <span className="settings-toggle-label">Spellcheck</span>
              <button className={`toggle-btn ${spellcheck ? "active" : ""}`} onClick={() => onSpellcheckChange(!spellcheck)}>
                <div className="toggle-knob" />
              </button>
            </div>
            <p className="settings-hint">Enable browser spellcheck in the editor.</p>
          </div>

          <div className="settings-section">
            <div className="settings-label">Vault</div>
            {vaultPath && <p className="vault-path">{vaultPath}</p>}
            <p className="settings-hint">Change the folder where your notes are stored.</p>
            <button className="btn-secondary" onClick={onSwitchVault}>Switch Vault Folder</button>
          </div>

          <div className="settings-section">
            <div className="settings-label">Keyboard Shortcuts</div>
            <div className="shortcuts-list">
              <div className="shortcut-row"><span>Save</span><kbd>Ctrl+S</kbd></div>
              <div className="shortcut-row"><span>Preview</span><kbd>Ctrl+E</kbd></div>
              <div className="shortcut-row"><span>Split View</span><kbd>Ctrl+Shift+E</kbd></div>
              <div className="shortcut-row"><span>Search / Commands</span><kbd>Ctrl+P</kbd></div>
              <div className="shortcut-row"><span>Global Search</span><kbd>Ctrl+Shift+F</kbd></div>
              <div className="shortcut-row"><span>New Note</span><kbd>Ctrl+N</kbd></div>
              <div className="shortcut-row"><span>Daily Note</span><kbd>Ctrl+Shift+N</kbd></div>
              <div className="shortcut-row"><span>Settings</span><kbd>Ctrl+,</kbd></div>
              <div className="shortcut-row"><span>Help</span><kbd>F1</kbd></div>
              <div className="shortcut-row"><span>Focus Mode</span><kbd>F9</kbd></div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">About</div>
            <p className="settings-hint">
              Void Notes v{APP_VERSION} — expanded<br />
              A knowledge management notepad with Obsidian-like features.<br />
              Built with Electron + React + CodeMirror 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
