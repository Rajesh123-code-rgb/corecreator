"use client";

import * as React from "react";
import { FOCUS_VISIBLE_STYLES } from "@/lib/accessibility";

/**
 * Skip to main content link for keyboard navigation
 */
export function SkipLink({ targetId = "main-content", label = "Skip to main content" }: {
    targetId?: string;
    label?: string;
}) {
    return (
        <a
            href={`#${targetId}`}
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:shadow-lg"
            style={{ outline: "none" }}
        >
            {label}
        </a>
    );
}

/**
 * Visually hidden text for screen readers
 */
export function VisuallyHidden({ children, as: Component = "span" }: {
    children: React.ReactNode;
    as?: React.ElementType;
}) {
    return (
        <Component className="sr-only">
            {children}
        </Component>
    );
}

/**
 * Live region for screen reader announcements
 */
export function LiveRegion({ message, priority = "polite" }: {
    message: string;
    priority?: "polite" | "assertive";
}) {
    return (
        <div
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
        >
            {message}
        </div>
    );
}

/**
 * Loading spinner with accessibility
 */
export function LoadingSpinner({ size = "md", label = "Loading" }: {
    size?: "sm" | "md" | "lg";
    label?: string;
}) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    return (
        <div role="status" aria-label={label}>
            <svg
                className={`animate-spin ${sizeClasses[size]} text-purple-600`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            <span className="sr-only">{label}</span>
        </div>
    );
}

/**
 * Focus trap component for modals/dialogs
 */
export function FocusTrap({ children, active = true }: {
    children: React.ReactNode;
    active?: boolean;
}) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!active || !containerRef.current) return;

        const container = containerRef.current;
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        firstElement?.focus();

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== "Tab") return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        }

        container.addEventListener("keydown", handleKeyDown);
        return () => container.removeEventListener("keydown", handleKeyDown);
    }, [active]);

    return <div ref={containerRef}>{children}</div>;
}

/**
 * Accessible icon button
 */
export function IconButton({
    icon,
    label,
    onClick,
    disabled = false,
    variant = "default",
    size = "md",
    className = "",
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "default" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const sizeClasses = {
        sm: "p-1",
        md: "p-2",
        lg: "p-3",
    };

    const variantClasses = {
        default: "bg-gray-100 hover:bg-gray-200 text-gray-700",
        ghost: "hover:bg-gray-100 text-gray-600",
        danger: "hover:bg-red-50 text-red-600",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            className={`rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        >
            {icon}
        </button>
    );
}

/**
 * Accessible progress bar
 */
export function ProgressBar({
    value,
    max = 100,
    label,
    showValue = true,
    size = "md",
}: {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    size?: "sm" | "md" | "lg";
}) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeClasses = {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
    };

    return (
        <div className="w-full">
            {(label || showValue) && (
                <div className="flex justify-between text-sm mb-1">
                    {label && <span className="text-gray-600">{label}</span>}
                    {showValue && <span className="text-gray-500">{Math.round(percentage)}%</span>}
                </div>
            )}
            <div
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label}
                className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
            >
                <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Accessible badge/tag
 */
export function Badge({
    children,
    variant = "default",
    size = "md",
}: {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "error" | "info";
    size?: "sm" | "md";
}) {
    const variantClasses = {
        default: "bg-gray-100 text-gray-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-yellow-100 text-yellow-700",
        error: "bg-red-100 text-red-700",
        info: "bg-blue-100 text-blue-700",
    };

    const sizeClasses = {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-sm",
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}
        >
            {children}
        </span>
    );
}

/**
 * Accessible tooltip wrapper
 */
export function Tooltip({
    children,
    content,
    position = "top",
}: {
    children: React.ReactNode;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
}) {
    const [visible, setVisible] = React.useState(false);
    const id = React.useId();

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
        >
            <div aria-describedby={visible ? id : undefined}>
                {children}
            </div>
            {visible && (
                <div
                    id={id}
                    role="tooltip"
                    className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${positionClasses[position]}`}
                >
                    {content}
                </div>
            )}
        </div>
    );
}
