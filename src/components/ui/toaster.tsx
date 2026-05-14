"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "info";
}

interface ToastContextType {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {toasts.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] space-y-2 max-w-sm mx-auto">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white animate-slide-up",
                t.variant === "success" && "border-green-200",
                t.variant === "error" && "border-red-200",
                t.variant === "info" && "border-blue-200"
              )}
            >
              {t.variant === "success" && <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />}
              {t.variant === "error" && <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
              {t.variant === "info" && <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                )}
              </div>
              <button onClick={() => removeToast(t.id)} className="shrink-0">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
