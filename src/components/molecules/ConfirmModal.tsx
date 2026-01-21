"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    loading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    loading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <Trash2 className="w-6 h-6 text-red-600" />,
            buttonClass: "bg-red-600 hover:bg-red-700 text-white",
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
            buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
        },
        info: {
            icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
            buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        {styles.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className="text-gray-600 mt-1">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        className={styles.buttonClass}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Hook for easier usage
export function useConfirmModal() {
    const [state, setState] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        variant: "danger" | "warning" | "info";
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "Confirm",
        message: "",
        confirmText: "Confirm",
        variant: "danger",
        onConfirm: () => { },
    });

    const confirm = React.useCallback(
        (options: {
            title?: string;
            message: string;
            confirmText?: string;
            variant?: "danger" | "warning" | "info";
            onConfirm: () => void;
        }) => {
            setState({
                isOpen: true,
                title: options.title || "Confirm",
                message: options.message,
                confirmText: options.confirmText || "Confirm",
                variant: options.variant || "danger",
                onConfirm: options.onConfirm,
            });
        },
        []
    );

    const close = React.useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return {
        state,
        confirm,
        close,
        ConfirmModalElement: (
            <ConfirmModal
                isOpen={state.isOpen}
                onClose={close}
                onConfirm={() => {
                    state.onConfirm();
                    close();
                }}
                title={state.title}
                message={state.message}
                confirmText={state.confirmText}
                variant={state.variant}
            />
        ),
    };
}
