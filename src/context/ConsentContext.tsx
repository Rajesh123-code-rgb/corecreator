"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/usePerformance";

/**
 * Cookie categories, mirroring the four described on /cookies.
 * Essential is not represented here because it can never be declined -
 * those cookies are required for the site to function at all.
 */
export interface ConsentState {
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
}

export const CONSENT_STORAGE_KEY = "cookie-consent";

const ACCEPT_ALL: ConsentState = { analytics: true, functional: true, marketing: true };
const REJECT_NON_ESSENTIAL: ConsentState = { analytics: false, functional: false, marketing: false };

interface ConsentContextType {
    /** null until the visitor has made a choice - used to decide whether to show the banner. */
    consent: ConsentState | null;
    /** False during SSR and the first client render, to avoid a hydration mismatch. */
    isHydrated: boolean;
    acceptAll: () => void;
    rejectNonEssential: () => void;
    savePreferences: (choice: ConsentState) => void;
}

const ConsentContext = React.createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
    const [consent, setConsent] = useLocalStorage<ConsentState | null>(CONSENT_STORAGE_KEY, null);
    const [isHydrated, setIsHydrated] = React.useState(false);

    // useLocalStorage reads storage in its useState initializer, which returns
    // the initial value on the server but the stored value on the client - so
    // gate anything that renders off `consent` until after mount.
    React.useEffect(() => {
        setIsHydrated(true);
    }, []);

    const acceptAll = React.useCallback(() => setConsent(ACCEPT_ALL), [setConsent]);
    const rejectNonEssential = React.useCallback(() => setConsent(REJECT_NON_ESSENTIAL), [setConsent]);
    const savePreferences = React.useCallback((choice: ConsentState) => setConsent(choice), [setConsent]);

    return (
        <ConsentContext.Provider
            value={{ consent, isHydrated, acceptAll, rejectNonEssential, savePreferences }}
        >
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent() {
    const context = React.useContext(ConsentContext);
    if (!context) {
        throw new Error("useConsent must be used within a ConsentProvider");
    }
    return context;
}
