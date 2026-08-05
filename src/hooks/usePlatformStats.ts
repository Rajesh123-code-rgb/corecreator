import { useEffect, useState } from "react";
import type { PlatformStats } from "@/lib/platformStats";

// Conservative fallback while the real numbers load (or if the request fails) -
// zero, not a marketing figure, so we never show something we can't stand behind.
const DEFAULT_STATS: PlatformStats = {
    products: 0,
    courses: 0,
    creators: 0,
    learners: 0,
    creatorEarnings: 0,
};

export function usePlatformStats(): { stats: PlatformStats; isLoading: boolean } {
    const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                const res = await fetch("/api/platform-stats");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setStats({
                            products: data.products ?? 0,
                            courses: data.courses ?? 0,
                            creators: data.creators ?? 0,
                            learners: data.learners ?? 0,
                            creatorEarnings: data.creatorEarnings ?? 0,
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load platform stats:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchStats();
        return () => {
            isMounted = false;
        };
    }, []);

    return { stats, isLoading };
}
