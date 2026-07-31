"use client";

import React from "react";
import { useCurrency, Currency } from "@/context/CurrencyContext";
import { cn } from "@/lib/utils";

interface PriceDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
    amount: number;
    sourceCurrency?: Currency;
    /** Hide fractional parts for whole numbers */
    hideFractionsForWhole?: boolean;
    /** Use minimal formatting if needed */
    options?: Intl.NumberFormatOptions;
}

export default function PriceDisplay({
    amount,
    sourceCurrency = "INR", // 99% of DB entries will be in INR base price
    hideFractionsForWhole = false,
    options,
    className,
    ...props
}: PriceDisplayProps) {
    const { formatPrice } = useCurrency();
    const [mounted, setMounted] = React.useState(false);

    // Prevent SSR hydration mismatch since currency relies on localStorage
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <span className={cn("inline-block w-16 h-5 bg-[var(--muted)] animate-pulse rounded", className)} {...props} />
        );
    }

    const formatOptions: Intl.NumberFormatOptions = {
        ...options,
    };

    if (hideFractionsForWhole && amount % 1 === 0) {
        formatOptions.minimumFractionDigits = 0;
        formatOptions.maximumFractionDigits = 0;
    }

    const formattedAmount = formatPrice(amount, sourceCurrency, formatOptions);

    return (
        <span className={className} {...props}>
            {formattedAmount}
        </span>
    );
}
