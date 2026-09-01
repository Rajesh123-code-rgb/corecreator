"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/atoms";
import { ART_FORM_GROUPS, type ArtForm } from "@/lib/artForms";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

interface Entry extends ArtForm {
    group: string;
}

const ALL: Entry[] = ART_FORM_GROUPS.flatMap((g) =>
    g.forms.map((f) => ({ ...f, group: g.label }))
);
const GROUPS = ART_FORM_GROUPS.map((g) => g.label);

/**
 * The art forms the marketplace covers, on the home page.
 *
 * Deliberately typographic rather than image-led. The other category strip uses
 * stock photography, which works for "Paintings" and "Ceramics" but not here:
 * putting an approximate stock image next to Aboriginal Dot Painting, Huichol
 * Beadwork or Pysanka would mislabel living cultural traditions, and a wrong
 * picture is worse than none. The descriptions carry the section instead, which
 * is also what makes it useful to someone who does not yet know the term.
 */
export function ArtFormsShowcase() {
    const [group, setGroup] = React.useState<string | null>(null);
    const [shown, setShown] = React.useState(PAGE_SIZE);

    const filtered = React.useMemo(
        () => (group ? ALL.filter((f) => f.group === group) : ALL),
        [group]
    );
    const visible = filtered.slice(0, shown);
    const remaining = filtered.length - visible.length;

    const pick = (next: string | null) => {
        setGroup(next);
        setShown(PAGE_SIZE);
    };

    return (
        <section className="py-20 bg-[var(--background)]" aria-labelledby="art-forms-heading">
            <div className="container-app">
                <div className="flex items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 id="art-forms-heading" className="text-3xl lg:text-4xl font-bold mb-2">
                            Art &amp; Craft Traditions <span className="text-gradient-purple">Worldwide</span>
                        </h2>
                        <p className="text-[var(--muted-foreground)] max-w-2xl">
                            From Japanese kintsugi to Madhubani painting — {ALL.length} forms practised by
                            makers on Core Creator, each with work to buy and courses to learn from.
                        </p>
                    </div>
                    <Button variant="outline" className="hidden sm:flex flex-shrink-0" asChild>
                        <Link href="/marketplace">
                            Browse all<ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </div>

                {/* Filters. Buttons rather than links: this narrows what is already
                    on the page and should not cost a navigation. */}
                <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter art forms by tradition">
                    <FilterChip active={group === null} onClick={() => pick(null)}>
                        All {ALL.length}
                    </FilterChip>
                    {GROUPS.map((g) => (
                        <FilterChip key={g} active={group === g} onClick={() => pick(g)}>
                            {g}
                        </FilterChip>
                    ))}
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
                    {visible.map((form) => (
                        <li key={form.slug}>
                            <Link
                                href={`/marketplace?category=${form.slug}`}
                                className="group flex flex-col h-full p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] transition-colors hover:border-[var(--secondary-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--secondary-500)]"
                            >
                                <span className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                                    {form.group}
                                </span>
                                <span className="font-semibold text-[var(--foreground)] mb-1.5 flex items-center gap-1.5">
                                    {form.name}
                                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                                </span>
                                <span className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                                    {form.description}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="mt-8 flex flex-col items-center gap-3">
                    {/* Announced, so it is clear something happened after the click
                        for anyone not watching the grid grow. */}
                    <p className="text-sm text-[var(--muted-foreground)]" aria-live="polite">
                        Showing {visible.length} of {filtered.length}
                    </p>
                    {remaining > 0 && (
                        <Button variant="outline" size="lg" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                            Load more ({remaining} remaining)
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                // min-h-11 keeps these above the 24px WCAG 2.2 target minimum
                // with room to spare, matching the tap targets fixed in Phase 8.
                "px-4 min-h-11 rounded-full text-sm font-medium border transition-colors",
                active
                    ? "bg-[var(--secondary-500)] text-white border-[var(--secondary-500)]"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--secondary-500)] hover:text-[var(--foreground)]"
            )}
        >
            {children}
        </button>
    );
}

export default ArtFormsShowcase;
