"use client";

import * as React from "react";

interface FilterTab {
    id: string;
    label: string;
    value: "all" | "published" | "draft" | "review";
    count: number;
}

interface StatusFilterTabsProps {
    activeFilter: "all" | "published" | "draft" | "review";
    onFilterChange: (filter: "all" | "published" | "draft" | "review") => void;
    counts: {
        all: number;
        published: number;
        draft: number;
        review: number;
    };
}

export function StatusFilterTabs({ activeFilter, onFilterChange, counts }: StatusFilterTabsProps) {
    const tabs: FilterTab[] = [
        { id: "all", label: "All Courses", value: "all", count: counts.all },
        { id: "published", label: "Published", value: "published", count: counts.published },
        { id: "draft", label: "Draft", value: "draft", count: counts.draft },
        { id: "review", label: "Under Review", value: "review", count: counts.review },
    ];

    return (
        <div className="border-b border-[var(--border)]">
            <div className="flex gap-6 overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = activeFilter === tab.value;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onFilterChange(tab.value)}
                            className={`
                                relative px-4 py-3 font-medium text-sm whitespace-nowrap
                                transition-colors duration-200
                                ${isActive
                                    ? "text-[var(--primary-600)] border-b-2 border-[var(--primary-600)]"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }
                            `}
                        >
                            <span className="flex items-center gap-2">
                                {tab.label}
                                <span
                                    className={`
                                        px-2 py-0.5 rounded-full text-xs font-semibold
                                        ${isActive
                                            ? "bg-[var(--primary-100)] text-[var(--primary-700)]"
                                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                        }
                                    `}
                                >
                                    {tab.count}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
