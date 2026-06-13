import React from "react";

interface VaultSetupProps {
  onVaultSelect: (path: string) => void;
}

export default function VaultSetup({ onVaultSelect }: VaultSetupProps) {
  const handleClick = async () => {
    // File System Access API — tylko w Chromium/Electron
    if ("showDirectoryPicker" in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        onVaultSelect(dirHandle.name);
      } catch {
        // Użytkownik anulował
      }
    } else {
      // Fallback — użyj domyślnej ścieżki
      onVaultSelect("notes");
    }
  };

  return (
    <div className="vault-setup">
      <div className="vault-setup-card">
        <div className="vault-setup-logo">&#128221;</div>
        <h1 className="vault-setup-title">Void Notes</h1>
        <p className="vault-setup-subtitle">
          Your second brain.<br />
          Choose a folder to get started.
        </p>
        <button className="vault-setup-btn" onClick={handleClick}>
          Open Vault Folder
        </button>
        <p className="vault-setup-hint">
          All your notes will be stored locally in the selected folder.
        </p>
      </div>
    </div>
  );
}
