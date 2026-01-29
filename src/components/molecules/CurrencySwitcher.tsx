"use client";

import * as React from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrencySwitcherProps {
    className?: string;
    variant?: "default" | "minimal";
}

export function CurrencySwitcher({ className, variant = "default" }: CurrencySwitcherProps) {
    const { currency, setCurrency } = useCurrency();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn("w-20 h-9 bg-[var(--muted)] rounded-lg animate-pulse", className)} />;
    }

    return (
        <div className={cn("relative group", className)}>
            <div className="relative">
                <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className={cn(
                        "appearance-none cursor-pointer pl-3 pr-8 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all",
                        "bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)]"
                    )}
                    aria-label="Select Currency"
                >
                    <option value="INR" className="bg-[var(--card)] text-[var(--foreground)]">INR (₹)</option>
                    <option value="USD" className="bg-[var(--card)] text-[var(--foreground)]">USD ($)</option>
                    <option value="EUR" className="bg-[var(--card)] text-[var(--foreground)]">EUR (€)</option>
                    <option value="GBP" className="bg-[var(--card)] text-[var(--foreground)]">GBP (£)</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className={cn(
                        "w-4 h-4 opacity-50 text-[var(--foreground)]"
                    )} />
                </div>
            </div>
        </div>
    );
}
