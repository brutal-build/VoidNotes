import { useState, useCallback, useRef } from "react";
import type { ToastType } from "../components/Toast";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const MAX_VISIBLE = 3;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      if (next.length > MAX_VISIBLE) {
        return next.slice(next.length - MAX_VISIBLE);
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
