import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        { className, type, label, error, hint, leftIcon, rightIcon, id, ...props },
        ref
    ) => {
        const inputId = id || React.useId();

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        id={inputId}
                        className={cn(
                            "flex h-11 w-full rounded-lg border border-[var(--input)] bg-transparent px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error && "border-[var(--error)] focus:ring-[var(--error)]",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {hint && !error && (
                    <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">{hint}</p>
                )}
                {error && (
                    <p className="mt-1.5 text-xs text-[var(--error)]">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
