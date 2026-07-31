"use client";

import { useEffect } from "react";
import { Button } from "@/components/atoms";
import { AlertOctagon } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Option to log the error to an error reporting service like Sentry
        console.error("Global error caught:", error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-[var(--background)] px-4">
            <div className="max-w-md w-full p-8 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-xl text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertOctagon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-[var(--foreground)]">Something went wrong</h2>
                <p className="text-[var(--muted-foreground)] mb-8">
                    An unexpected error occurred. We've been notified and are looking into it.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={() => reset()} className="w-full sm:w-auto">
                        Try Again
                    </Button>
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/">Go to Homepage</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
