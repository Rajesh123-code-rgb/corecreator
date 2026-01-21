// Accessibility utility functions and constants

/**
 * Keyboard key codes for accessibility
 */
export const KEYS = {
    ENTER: "Enter",
    SPACE: " ",
    ESCAPE: "Escape",
    TAB: "Tab",
    ARROW_UP: "ArrowUp",
    ARROW_DOWN: "ArrowDown",
    ARROW_LEFT: "ArrowLeft",
    ARROW_RIGHT: "ArrowRight",
    HOME: "Home",
    END: "End",
} as const;

/**
 * Check if an element should be focusable
 */
export function isFocusable(element: HTMLElement): boolean {
    if (element.tabIndex < 0) return false;
    if ((element as HTMLInputElement).disabled) return false;

    const tagName = element.tagName.toLowerCase();
    const focusableTags = ["a", "button", "input", "select", "textarea"];

    if (focusableTags.includes(tagName)) return true;
    if (element.tabIndex >= 0) return true;

    return false;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
    ].join(", ");

    return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key !== KEYS.TAB) return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    }

    container.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener("keydown", handleKeyDown);
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.setAttribute("class", "sr-only");
    announcer.style.cssText = "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";

    document.body.appendChild(announcer);

    // Delay to ensure screen reader picks up the change
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);

    // Clean up
    setTimeout(() => {
        document.body.removeChild(announcer);
    }, 1000);
}

/**
 * Generate unique IDs for accessibility attributes
 */
let idCounter = 0;
export function generateId(prefix = "a11y"): string {
    return `${prefix}-${++idCounter}`;
}

/**
 * Handle click AND keyboard activation (Enter/Space)
 */
export function handleActivation(
    callback: () => void
): {
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
} {
    return {
        onClick: callback,
        onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === KEYS.ENTER || e.key === KEYS.SPACE) {
                e.preventDefault();
                callback();
            }
        },
    };
}

/**
 * Skip link component props
 */
export interface SkipLinkProps {
    targetId: string;
    label?: string;
}

/**
 * Common ARIA labels
 */
export const ARIA_LABELS = {
    loading: "Loading, please wait",
    closeDialog: "Close dialog",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    search: "Search",
    notification: "Notifications",
    userMenu: "User menu",
    pagination: {
        previous: "Go to previous page",
        next: "Go to next page",
        page: (n: number) => `Go to page ${n}`,
    },
    sort: {
        ascending: "Sort ascending",
        descending: "Sort descending",
    },
} as const;

/**
 * Focus visible styles (for keyboard navigation)
 */
export const FOCUS_VISIBLE_STYLES = {
    outline: "2px solid #8b5cf6",
    outlineOffset: "2px",
} as const;
