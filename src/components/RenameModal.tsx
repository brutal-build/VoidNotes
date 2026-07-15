import React from "react";

interface RenameModalProps {
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RenameModal({
  renameValue,
  onRenameValueChange,
  onConfirm,
  onCancel,
}: RenameModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Rename Note</h2>
          <button className="btn-icon" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal-body">
          <input
            className="rename-input"
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm();
              if (e.key === "Escape") onCancel();
            }}
            autoFocus
          />
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-secondary btn-accent" onClick={onConfirm}>Rename</button>
          </div>
        </div>
      </div>
    </div>
  );
}
