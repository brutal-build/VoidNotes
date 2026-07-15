import React from "react";
import { APP_VERSION } from "../plugins/updater";
import type { ThemeName } from "../types";
const THEMES: { name: ThemeName; label: string; colors: { bg: string; accent: string; text: string } | null }[] = [
  { name: "obsidian", label: "Obsidian", colors: { bg: "#1e1e1e", accent: "#8a70d6", text: "#e0e0e0" } },
  { name: "light", label: "Light", colors: { bg: "#ffffff", accent: "#7c5cbf", text: "#1a1a1a" } },
  { name: "macos", label: "macOS", colors: { bg: "#1a1a1a", accent: "#007AFF", text: "#e0e0e0" } },
  { name: "system", label: "System", colors: null },
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
  autoUpdate: boolean;
  onAutoUpdateChange: (v: boolean) => void;
  dailyNoteTemplate: string;
  onDailyNoteTemplateChange: (v: string) => void;
  activeNote: string | null;
  onExportNote: () => Promise<void>;
  onExportVaultZip: () => Promise<void>;
  onExportNoteHtml: () => Promise<void>;
  onOpenVaultStats: () => void;
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
  autoUpdate,
  onAutoUpdateChange,
  dailyNoteTemplate,
  onDailyNoteTemplateChange,
  activeNote,
  onExportNote,
  onExportVaultZip,
  onExportNoteHtml,
  onOpenVaultStats,
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
                  {t.colors ? (
                    <div className="theme-preview">
                      <div className="theme-preview-bg" style={{ background: t.colors.bg }} />
                      <div className="theme-preview-accent" style={{ background: t.colors.accent }} />
                      <div className="theme-preview-text" style={{ background: t.colors.text }} />
                    </div>
                  ) : (
                    <div className="theme-preview theme-preview-system">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="6" strokeDasharray="0 12"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
                      </svg>
                    </div>
                  )}
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

            <div className="settings-toggle-row" style={{ marginTop: "var(--space-md)" }}>
              <span className="settings-toggle-label">Auto-update</span>
              <button className={`toggle-btn ${autoUpdate ? "active" : ""}`} onClick={() => onAutoUpdateChange(!autoUpdate)}>
                <div className="toggle-knob" />
              </button>
            </div>
            <p className="settings-hint">Download updates automatically without asking.</p>
          </div>

          <div className="settings-section">
            <div className="settings-label">Daily Notes</div>
            <p className="settings-hint">Template used when creating a daily note. Use {"{{date}}"} for the current date.</p>
            <textarea
              value={dailyNoteTemplate}
              onChange={(e) => onDailyNoteTemplateChange(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "var(--space-sm) var(--space-md)",
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                fontFamily: "var(--font-mono)",
                resize: "vertical",
                outline: "none",
              }}
            />
            <p className="settings-hint" style={{ marginTop: 4, opacity: 0.7 }}>
              Preview: {dailyNoteTemplate.replace(/\{\{date\}\}/g, new Date().toISOString().split("T")[0]).split("\n")[0]}
            </p>
          </div>

          <div className="settings-section">
            <div className="settings-label">Export</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <button className="btn-secondary" onClick={onExportNote} disabled={!activeNote}>
                Export Current Note as Markdown
              </button>
              <button className="btn-secondary" onClick={onExportNoteHtml} disabled={!activeNote}>
                Export Current Note as HTML
              </button>
              <button className="btn-secondary" onClick={onExportVaultZip}>
                Export Vault as ZIP
              </button>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Vault</div>
            {vaultPath && <p className="vault-path">{vaultPath}</p>}
            <p className="settings-hint">Change the folder where your notes are stored.</p>
            <button className="btn-secondary" onClick={onSwitchVault}>Switch Vault Folder</button>
          </div>

          <div className="settings-section">
            <div className="settings-label">Vault Statistics</div>
            <p className="settings-hint">View note count, tags, links, size, and more.</p>
            <button className="btn-secondary" onClick={onOpenVaultStats}>Open Vault Statistics</button>
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
              <div className="shortcut-row"><span>Daily Note</span><kbd>Ctrl+D</kbd></div>
              <div className="shortcut-row"><span>Settings</span><kbd>Ctrl+,</kbd></div>
              <div className="shortcut-row"><span>Help</span><kbd>F1</kbd></div>
              <div className="shortcut-row"><span>Focus Mode</span><kbd>F9</kbd></div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">About</div>
            <p className="settings-hint">
              Void Notes v{APP_VERSION} - expanded<br />
              A knowledge management notepad with Obsidian-like features.<br />
              Built with Electron + React + CodeMirror 6.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
