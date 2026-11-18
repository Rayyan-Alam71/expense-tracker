"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; error?: boolean };
const ToastContext = createContext<(message: string, error?: boolean) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, error = false) => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, error }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3000);
  }, []);
  return <ToastContext.Provider value={show}>{children}<div aria-live="polite" className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2">{toasts.map((toast) => <div key={toast.id} className={`rounded-xl px-4 py-3 text-sm text-white shadow-lg ${toast.error ? "bg-slate-800" : "bg-indigo-600"}`}>{toast.message}</div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}
