import { useEffect, useState } from "react";
import { DEFAULT_GST_RATE } from "@/lib/tax";

/**
 * The tax rate the server will actually charge, so the cart and checkout stop
 * hardcoding their own. Falls back to the same default the server uses, so a
 * failed request cannot make the displayed total disagree with the charge.
 */
export function useTaxRate(): { rate: number; displayName: string; isLoading: boolean } {
    const [rate, setRate] = useState(DEFAULT_GST_RATE);
    const [displayName, setDisplayName] = useState("GST");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        fetch("/api/tax-rate")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!isMounted || !data) return;
                if (Number.isFinite(Number(data.rate))) setRate(Number(data.rate));
                if (data.displayName) setDisplayName(data.displayName);
            })
            .catch(() => {
                // Keep the default; it matches the server's own fallback.
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    return { rate, displayName, isLoading };
}
