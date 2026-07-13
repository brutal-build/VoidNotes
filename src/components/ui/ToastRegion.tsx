import React from "react";

export interface ToastMessage {
  id: string | number;
  message: React.ReactNode;
}

export interface ToastRegionProps {
  messages: readonly ToastMessage[];
  className?: string;
}

export function ToastRegion({ messages, className }: ToastRegionProps) {
  return (
    <div className={className} role="status" aria-live="polite" aria-atomic="true">
      {messages.map((toast) => <div key={toast.id}>{toast.message}</div>)}
    </div>
  );
}
