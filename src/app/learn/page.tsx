import * as React from "react";
import { getCourses } from "@/lib/courseSearch";
import { LearnListClient } from "./LearnListClient";

export const metadata = {
    title: "Learn Art & Craft | Core Creator",
    description: "Access courses taught by professional artists — painting, drawing, sculpture, digital art, photography, ceramics and more. Start learning today.",
};

// Reading searchParams makes this dynamically rendered per request, which is
// what we want: results must always reflect the current filters.
export default async function LearnPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;

    const first = (value: string | string[] | undefined) =>
        Array.isArray(value) ? value[0] : value;

    const { courses, pagination } = await getCourses({
        page: parseInt(first(params.page) || "1"),
        limit: 12,
        category: first(params.category) ?? null,
        level: first(params.level) ?? null,
        minRating: first(params.minRating) ?? null,
        sort: first(params.sort) ?? null,
        search: first(params.search) ?? null,
    });

    // Strip Mongoose/ObjectId/Date types before handing to a Client Component.
    const initialCourses = JSON.parse(JSON.stringify(courses));

    return (
        <React.Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--secondary-500)] border-t-transparent rounded-full" />
                </div>
            }
        >
            <LearnListClient initialCourses={initialCourses} initialPagination={pagination} />
        </React.Suspense>
    );
}
