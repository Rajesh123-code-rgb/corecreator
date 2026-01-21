// Performance optimization utilities

/**
 * Debounce function - delays execution until after wait milliseconds
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (this: unknown, ...args: Parameters<T>) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Throttle function - limits execution to once per limit milliseconds
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return function (this: unknown, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Memoize function with LRU cache
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
    func: T,
    maxSize = 100
): T {
    const cache = new Map<string, ReturnType<T>>();

    return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            const value = cache.get(key)!;
            // Move to end (most recently used)
            cache.delete(key);
            cache.set(key, value);
            return value;
        }

        const result = func.apply(this, args) as ReturnType<T>;

        // Evict oldest if at capacity
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            if (firstKey) {
                cache.delete(firstKey);
            }
        }

        cache.set(key, result);
        return result;
    } as T;
}

/**
 * Lazy load images using Intersection Observer
 */
export function createImageObserver(options?: IntersectionObserverInit): IntersectionObserver | null {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
        return null;
    }

    return new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                const src = img.dataset.src;

                if (src) {
                    img.src = src;
                    img.removeAttribute("data-src");
                    img.classList.remove("lazy");
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: "50px 0px",
        threshold: 0.01,
        ...options,
    });
}

/**
 * Prefetch a page or resource
 */
export function prefetch(url: string, as: "document" | "script" | "style" | "image" = "document"): void {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = as;
    document.head.appendChild(link);
}

/**
 * Batch DOM reads/writes to prevent layout thrashing
 */
export const domScheduler = {
    reads: [] as (() => void)[],
    writes: [] as (() => void)[],
    scheduled: false,

    read(fn: () => void): void {
        this.reads.push(fn);
        this.schedule();
    },

    write(fn: () => void): void {
        this.writes.push(fn);
        this.schedule();
    },

    schedule(): void {
        if (this.scheduled) return;
        this.scheduled = true;

        requestAnimationFrame(() => {
            // Execute all reads first
            const reads = this.reads.splice(0);
            reads.forEach((fn) => fn());

            // Then all writes
            const writes = this.writes.splice(0);
            writes.forEach((fn) => fn());

            this.scheduled = false;
        });
    },
};

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Measure execution time of async function
 */
export async function measureTime<T>(
    name: string,
    fn: () => Promise<T>
): Promise<T> {
    const start = performance.now();
    try {
        return await fn();
    } finally {
        const duration = performance.now() - start;
        console.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(
    callback: () => void,
    options?: { timeout?: number }
): number {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        return (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout?: number }) => number }).requestIdleCallback(callback, options);
    }
    return setTimeout(callback, options?.timeout || 1) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallback(id: number): void {
    if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
    } else {
        clearTimeout(id);
    }
}
