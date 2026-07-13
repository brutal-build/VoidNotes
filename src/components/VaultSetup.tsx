import React, { useState } from "react";

interface VaultSetupProps {
  onVaultSelect: (path: string) => void;
}

export default function VaultSetup({ onVaultSelect }: VaultSetupProps) {
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    const result = await window.electronAPI.selectVault();
    if (result.ok) {
      onVaultSelect(result.value);
    } else if (result.error.code !== "CANCELLED") {
      setError(result.error.message);
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
        {error && <p className="vault-setup-error" role="alert">{error}</p>}
        <p className="vault-setup-hint">
          All your notes will be stored locally in the selected folder.
        </p>
      </div>
    </div>
  );
}
