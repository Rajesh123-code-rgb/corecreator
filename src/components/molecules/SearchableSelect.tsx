"use client";

import * as React from "react";
import { ChevronDown, Check, Search } from "lucide-react";

interface Props {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    name?: string;
    autoComplete?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * A combobox: type to filter, click or use the keyboard to choose.
 *
 * A native <select> with 36 states is painful on a phone and impossible to
 * search; a plain text input accepts anything at all, which is how the checkout
 * previously took "State" and "Country". This keeps the filtering of a search
 * field while constraining the result to a real value.
 *
 * Keyboard: ArrowDown/ArrowUp move, Enter selects, Escape closes, Tab leaves.
 * The trigger is a real button and the list uses listbox semantics, so screen
 * readers announce it as a choice rather than a mystery text field.
 */
export function SearchableSelect({
    label, value, options, onChange, placeholder = "Select…",
    error, required, name, autoComplete, disabled, className = "",
}: Props) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [active, setActive] = React.useState(0);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);
    const id = React.useId();

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        // Prefer matches that start with the query - typing "ra" should offer
        // Rajasthan before Maharashtra.
        const starts = options.filter((o) => o.toLowerCase().startsWith(q));
        const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
        return [...starts, ...contains];
    }, [options, query]);

    React.useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    React.useEffect(() => {
        if (open) {
            setQuery(""); setActive(Math.max(0, options.indexOf(value)));
            // Focus after paint so the list is in the DOM.
            requestAnimationFrame(() => searchRef.current?.focus());
        }
    }, [open, options, value]);

    React.useEffect(() => {
        if (!open || !listRef.current) return;
        listRef.current.querySelector<HTMLElement>(`[data-idx="${active}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [active, open]);

    const choose = (option: string) => { onChange(option); setOpen(false); };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) choose(filtered[active]); }
        else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    };

    return (
        <div className={className} ref={rootRef}>
            <label htmlFor={`${id}-trigger`} className="block text-sm font-medium mb-1.5">
                {label}{required && <span className="text-red-600 ml-0.5">*</span>}
            </label>

            <div className="relative">
                <button
                    id={`${id}-trigger`}
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-invalid={Boolean(error)}
                    className={`w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-left text-sm bg-[var(--background)] transition-colors disabled:opacity-50 ${
                        error ? "border-red-500" : "border-[var(--border)] hover:border-[var(--secondary-400)]"
                    }`}
                >
                    <span className={value ? "" : "text-[var(--muted-foreground)]"}>
                        {value || placeholder}
                    </span>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 text-[var(--muted-foreground)] transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {/* Mirrors the choice for browser autofill and normal form semantics. */}
                <input type="hidden" name={name} value={value} autoComplete={autoComplete} />

                {open && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
                        <div className="p-2 border-b border-[var(--border)]">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                <input
                                    ref={searchRef}
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                                    onKeyDown={onKeyDown}
                                    placeholder="Type to search…"
                                    aria-label={`Search ${label}`}
                                    aria-controls={`${id}-list`}
                                    className="w-full pl-8 pr-2 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)]"
                                />
                            </div>
                        </div>

                        <ul
                            id={`${id}-list`}
                            ref={listRef}
                            role="listbox"
                            aria-label={label}
                            className="max-h-56 overflow-y-auto overscroll-contain py-1"
                        >
                            {filtered.length === 0 && (
                                <li className="px-3 py-3 text-sm text-[var(--muted-foreground)]">
                                    No match for “{query}”
                                </li>
                            )}
                            {filtered.map((option, i) => (
                                <li key={option} data-idx={i} role="option" aria-selected={option === value}>
                                    <button
                                        type="button"
                                        onMouseEnter={() => setActive(i)}
                                        onClick={() => choose(option)}
                                        className={`w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                                            i === active ? "bg-[var(--muted)]" : ""
                                        }`}
                                    >
                                        <span>{option}</span>
                                        {option === value && <Check className="w-4 h-4 text-[var(--secondary-600)]" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
    );
}
