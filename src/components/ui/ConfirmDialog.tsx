import React from "react";
import { Dialog } from "./Dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  variant?: "save-discard" | "destructive";
  confirmLabel?: string;
  onConfirm: () => void;
  onDiscard?: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, variant = "destructive", confirmLabel, onConfirm, onDiscard, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onEscape={onCancel} onBackdrop={onCancel}>
      <p className="dialog-message">{message}</p>
      <div className="dialog-actions">
        {variant === "save-discard" ? (
          <>
            <button type="button" onClick={onConfirm} className="dialog-button-primary">Save</button>
            <button type="button" onClick={onDiscard}>Discard</button>
            <button type="button" onClick={onCancel} className="dialog-button-secondary">Cancel</button>
          </>
        ) : (
          <>
            <button type="button" onClick={onCancel} className="dialog-button-secondary">Cancel</button>
            <button type="button" data-variant="destructive" onClick={onConfirm}>{confirmLabel ?? "Confirm"}</button>
          </>
        )}
      </div>
    </Dialog>
  );
}
