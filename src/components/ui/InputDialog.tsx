import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "./Dialog";

export interface InputDialogProps {
  open: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  validator?: (value: string) => string | null;
}

export function InputDialog({
  open,
  title,
  message,
  placeholder,
  defaultValue = "",
  confirmLabel = "Create",
  onConfirm,
  onCancel,
  validator,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Name cannot be empty");
      return;
    }
    const validationError = validator?.(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} title={title} onEscape={onCancel} onBackdrop={onCancel} className="input-dialog">
      <p className="dialog-message">{message}</p>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="dialog-input"
        aria-invalid={!!error}
        aria-describedby={error ? "input-error" : undefined}
      />
      {error && (
        <div id="input-error" className="dialog-error" role="alert">
          {error}
        </div>
      )}
      <div className="dialog-actions">
        <button type="button" onClick={handleConfirm} className="dialog-button-primary">
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className="dialog-button-secondary">
          Cancel
        </button>
      </div>
    </Dialog>
  );
}
