"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { useConsent, type ConsentState } from "@/context/ConsentContext";
import { Cookie } from "lucide-react";

// Wording mirrors the four categories described on /cookies so the banner and
// the policy page can't drift apart.
const CATEGORIES: { key: keyof ConsentState; label: string; description: string }[] = [
    { key: "analytics", label: "Analytics Cookies", description: "Help us understand how visitors interact with our site." },
    { key: "functional", label: "Functional Cookies", description: "Remember your choices (like language or region)." },
    { key: "marketing", label: "Marketing Cookies", description: "Used to deliver relevant advertisements." },
];

export function ConsentBanner() {
    const { consent, isHydrated, acceptAll, rejectNonEssential, savePreferences } = useConsent();
    const [showPreferences, setShowPreferences] = React.useState(false);
    const [draft, setDraft] = React.useState<ConsentState>({
        analytics: false,
        functional: false,
        marketing: false,
    });

    // Don't render until hydrated (avoids an SSR/client mismatch) or once the
    // visitor has already made a choice.
    if (!isHydrated || consent !== null) return null;

    return (
        <div
            role="dialog"
            aria-modal="false"
            aria-label="Cookie preferences"
            className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[var(--border)] bg-[var(--background)] shadow-2xl"
        >
            <div className="container-app py-5">
                {!showPreferences ? (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex gap-3">
                            <Cookie className="hidden h-6 w-6 flex-shrink-0 text-[var(--secondary-500)] sm:block" />
                            <p className="text-sm text-[var(--muted-foreground)]">
                                We use essential cookies to make this site work. With your permission we&apos;d also
                                like to use analytics, functional, and marketing cookies — read more in our{" "}
                                {/* prefetch disabled: the banner renders on every
                                    host, and on studio./admin. this link is
                                    cross-origin. Next's prefetch sends an RSC
                                    header, which is non-simple, so the browser
                                    fires a CORS preflight - and a page route does
                                    not accept OPTIONS, giving a 405 on every
                                    portal page load. Clicking still works; the
                                    prefetch never could. */}
                                <Link href="/cookies" prefetch={false} className="underline hover:text-[var(--foreground)]">
                                    Cookie Policy
                                </Link>
                                .
                            </p>
                        </div>
                        <div className="flex flex-shrink-0 flex-wrap gap-2">
                            <Button variant="outline" onClick={() => setShowPreferences(true)}>
                                Manage preferences
                            </Button>
                            <Button variant="outline" onClick={rejectNonEssential}>
                                Reject non-essential
                            </Button>
                            <Button onClick={acceptAll}>Accept all</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h2 className="font-semibold">Cookie preferences</h2>
                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                Essential cookies are always on — they&apos;re required for things like your cart and
                                staying signed in. Everything else is your choice.
                            </p>
                        </div>

                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 opacity-70">
                                <input
                                    type="checkbox"
                                    checked
                                    disabled
                                    aria-label="Essential Cookies (always active)"
                                    className="mt-1 h-4 w-4"
                                />
                                <div>
                                    <p className="text-sm font-medium">Essential Cookies — always active</p>
                                    <p className="text-sm text-[var(--muted-foreground)]">
                                        Necessary for the website to function (e.g., shopping cart, login).
                                    </p>
                                </div>
                            </li>

                            {CATEGORIES.map((category) => (
                                <li
                                    key={category.key}
                                    className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3"
                                >
                                    <input
                                        type="checkbox"
                                        id={`consent-${category.key}`}
                                        checked={draft[category.key]}
                                        onChange={(e) =>
                                            setDraft((prev) => ({ ...prev, [category.key]: e.target.checked }))
                                        }
                                        className="mt-1 h-4 w-4"
                                    />
                                    <div>
                                        <label htmlFor={`consent-${category.key}`} className="text-sm font-medium">
                                            {category.label}
                                        </label>
                                        <p className="text-sm text-[var(--muted-foreground)]">{category.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowPreferences(false)}>
                                Back
                            </Button>
                            <Button onClick={() => savePreferences(draft)}>Save preferences</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
