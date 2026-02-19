"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function variantClassName(variant: ToastVariant) {
  if (variant === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (variant === "error") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  return "border-slate-200 bg-white text-slate-900";
}

function generateToastId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = generateToastId();
      const item: ToastItem = {
        id,
        variant: "default",
        ...options,
      };

      setToasts((current) => [...current, item]);

      window.setTimeout(() => {
        remove(id);
      }, 3500);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] space-y-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "w-[320px] animate-fade-in rounded-lg border px-4 py-3 shadow-soft",
              variantClassName(item.variant ?? "default"),
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-xs opacity-90">{item.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => remove(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
