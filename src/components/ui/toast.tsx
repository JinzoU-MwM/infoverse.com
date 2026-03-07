"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ToastTone = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
  description?: string;
  action?: { label: string; href: string };
  dismissible?: boolean;
  onDismiss?: () => void;
};

const toneStyles: Record<ToastTone, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

const icons: Record<ToastTone, string> = {
  success: "✓",
  error: "⚠",
  warning: "⚡",
  info: "ℹ",
};

export function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (toast.tone === "success") {
      const timer = setTimeout(() => {
        setVisible(false);
        toast.onDismiss?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all ${toneStyles[toast.tone]}`}
      role="alert"
    >
      <span className="text-lg">{icons[toast.tone]}</span>
      <div className="flex-1">
        <p className="font-medium">{toast.message}</p>
        {toast.description ? (
          <p className="mt-1 text-sm opacity-80">{toast.description}</p>
        ) : null}
        {toast.action ? (
          <a
            href={toast.action.href}
            className="mt-2 inline-block text-sm font-medium underline"
          >
            {toast.action.label} →
          </a>
        ) : null}
      </div>
      {toast.dismissible !== false ? (
        <button
          onClick={() => {
            setVisible(false);
            toast.onDismiss?.();
          }}
          className="text-lg opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={{ ...toast, onDismiss: () => dismissToast(toast.id) }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToasts must be used within ToastProvider");
  }
  return context;
}
