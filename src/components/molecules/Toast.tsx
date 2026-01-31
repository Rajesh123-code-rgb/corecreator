"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast Types
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // ms, 0 = persistent
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 11);
        const duration = toast.duration ?? 5000;

        setToasts((prev) => [...prev, { ...toast, id }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: "success", title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: "error", title, message, duration: 8000 }); // Errors stay longer
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: "warning", title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: "info", title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

// Toast Container
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Individual Toast Item
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const styles = {
        success: {
            container: "bg-green-50 border-green-200 text-green-800",
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        },
        error: {
            container: "bg-red-50 border-red-200 text-red-800",
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        },
        warning: {
            container: "bg-amber-50 border-amber-200 text-amber-800",
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        },
        info: {
            container: "bg-blue-50 border-blue-200 text-blue-800",
            icon: <Info className="w-5 h-5 text-blue-500" />,
        },
    };

    const style = styles[toast.type];

    return (
        <div
            className={`
                ${style.container}
                border rounded-lg shadow-lg p-4 
                flex items-start gap-3
                animate-slide-in-right
                backdrop-blur-sm
            `}
            role="alert"
        >
            <div className="flex-shrink-0">{style.icon}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.message && <p className="text-sm mt-1 opacity-80">{toast.message}</p>}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// CSS Animation (add to global CSS)
// .animate-slide-in-right {
//     animation: slideInRight 0.3s ease-out;
// }
// @keyframes slideInRight {
//     from { transform: translateX(100%); opacity: 0; }
//     to { transform: translateX(0); opacity: 1; }
// }
