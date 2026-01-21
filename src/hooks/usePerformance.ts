"use client";

import * as React from "react";
import { debounce, throttle } from "@/lib/performance";

/**
 * Debounced value hook
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number,
    deps: React.DependencyList = []
): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => debounce(callback, delay) as T, [delay, ...deps]);
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    limit: number,
    deps: React.DependencyList = []
): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React.useMemo(() => throttle(callback, limit) as T, [limit, ...deps]);
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
    ref: React.RefObject<Element>,
    options?: IntersectionObserverInit
): boolean {
    const [isIntersecting, setIsIntersecting] = React.useState(false);

    React.useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, {
            rootMargin: "50px",
            threshold: 0.1,
            ...options,
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, options]);

    return isIntersecting;
}

/**
 * Local storage hook with SSR support
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = React.useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = React.useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                console.error("Error saving to localStorage:", error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [query]);

    return matches;
}

/**
 * Common breakpoint hooks
 */
export function useIsMobile(): boolean {
    return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
    return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
    return useMediaQuery("(min-width: 1024px)");
}

/**
 * Click outside hook
 */
export function useClickOutside<T extends HTMLElement>(
    callback: () => void
): React.RefObject<T | null> {
    const ref = React.useRef<T>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [callback]);

    return ref;
}

/**
 * Keyboard shortcut hook
 */
export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
): void {
    React.useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const { ctrl, shift, alt } = modifiers;

            if (ctrl && !event.ctrlKey && !event.metaKey) return;
            if (shift && !event.shiftKey) return;
            if (alt && !event.altKey) return;

            if (event.key.toLowerCase() === key.toLowerCase()) {
                event.preventDefault();
                callback();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [key, callback, modifiers]);
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = React.useRef<T>(undefined);

    React.useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * Mounted state hook
 */
export function useIsMounted(): boolean {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    return isMounted;
}

/**
 * Copy to clipboard hook
 */
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
    const [copied, setCopied] = React.useState(false);

    const copy = React.useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    }, []);

    return [copied, copy];
}
