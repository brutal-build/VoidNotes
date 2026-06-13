import React from "react";

interface SettingsProps {
  onClose: () => void;
  onSwitchVault: () => void;
}

export default function Settings({ onClose, onSwitchVault }: SettingsProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <div className="settings-label">Vault</div>
            <p className="settings-hint">Change the folder where your notes are stored.</p>
            <button className="btn-secondary" onClick={onSwitchVault}>
              Switch Vault Folder
            </button>
          </div>

          <div className="settings-section">
            <div className="settings-label">Keyboard Shortcuts</div>
            <div className="shortcuts-list">
              <div className="shortcut-row"><span>Save</span><kbd>Ctrl+S</kbd></div>
              <div className="shortcut-row"><span>Preview</span><kbd>Ctrl+E</kbd></div>
              <div className="shortcut-row"><span>Search</span><kbd>Ctrl+P</kbd></div>
              <div className="shortcut-row"><span>New Note</span><kbd>Ctrl+N</kbd></div>
              <div className="shortcut-row"><span>Settings</span><kbd>Ctrl+,</kbd></div>
              <div className="shortcut-row"><span>Help</span><kbd>F1</kbd></div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">About</div>
            <p className="settings-hint">
              Void Notes v0.2.5<br />
              A minimalist second-brain notepad.<br />
              Built with Electron + React + CodeMirror 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
