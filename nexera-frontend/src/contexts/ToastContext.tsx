"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastMethods = {
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* Toaster Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border bg-white pointer-events-auto transition-all duration-300 transform translate-x-0 opacity-100 ${
              t.type === "success"
                ? "border-green-100"
                : t.type === "error"
                ? "border-red-100"
                : "border-blue-100"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {t.type === "info" && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            
            <p className="text-sm font-medium text-gray-700 min-w-[200px]">{t.message}</p>
            
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
