import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--primary-500)] text-white shadow-md hover:bg-[var(--primary-600)] focus-visible:ring-[var(--primary-500)] active:scale-[0.98]",
                secondary:
                    "bg-[var(--secondary-500)] text-white shadow-md hover:bg-[var(--secondary-600)] focus-visible:ring-[var(--secondary-500)] active:scale-[0.98]",
                accent:
                    "gradient-gold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[var(--accent-500)]",
                destructive:
                    "bg-[var(--error)] text-white shadow-md hover:brightness-110 focus-visible:ring-red-500 active:scale-[0.98]",
                outline:
                    "border-2 border-[var(--border)] bg-transparent hover:bg-[var(--muted)] hover:border-[var(--secondary-500)] focus-visible:ring-[var(--secondary-500)]",
                ghost:
                    "hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:ring-[var(--secondary-500)]",
                link:
                    "text-[var(--secondary-500)] underline-offset-4 hover:underline focus-visible:ring-[var(--secondary-500)]",
                gradient:
                    "gradient-gold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-[var(--accent-500)]",
            },
            size: {
                sm: "h-9 px-3 text-xs",
                default: "h-11 px-5 py-2",
                lg: "h-12 px-8 text-base",
                xl: "h-14 px-10 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            isLoading = false,
            leftIcon,
            rightIcon,
            disabled,
            children,
            asChild = false,
            ...props
        },
        ref
    ) => {
        // If asChild, render children directly with button styles
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
                className: cn(buttonVariants({ variant, size, className }), (children as React.ReactElement<{ className?: string }>).props.className),
            });
        }

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
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
                ) : (
                    leftIcon
                )}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button, buttonVariants };
