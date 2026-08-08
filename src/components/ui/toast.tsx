"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; leaving: boolean };

const ToastContext = createContext<{ showToast: (message: string) => void } | null>(null);

const VISIBLE_MS = 2600;
const LEAVE_MS = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, leaving: false }]);

    setTimeout(() => {
      setToasts((t) => t.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    }, VISIBLE_MS);

    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, VISIBLE_MS + LEAVE_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg text-white"
            style={{
              background: "var(--foreground)",
              animation: `${t.leaving ? "toast-out" : "toast-in"} ${t.leaving ? LEAVE_MS : 200}ms ease-out forwards`,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
