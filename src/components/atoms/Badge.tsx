import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "bg-[var(--primary-100)] text-[var(--primary-700)]",
                secondary: "bg-[var(--secondary-100)] text-[var(--secondary-700)]",
                accent: "bg-[var(--accent-100)] text-[var(--accent-700)]",
                success: "bg-green-100 text-green-700",
                warning: "bg-amber-100 text-amber-700",
                error: "bg-red-100 text-red-700",
                outline: "border border-[var(--border)] text-[var(--foreground)]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
