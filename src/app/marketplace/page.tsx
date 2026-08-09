import * as React from "react";
import { getProducts } from "@/lib/productSearch";
import { MarketplaceListClient } from "./MarketplaceListClient";

export const metadata = {
    title: "Art & Craft Marketplace",
    description: "Discover unique handcrafted artworks from talented artists worldwide — paintings, ceramics, jewelry, textiles, digital art and more.",
    alternates: { canonical: "/marketplace" },
};

// Reading searchParams makes this dynamically rendered per request, which is
// what we want: results must always reflect the current filters, matching the
// client's previous cache: "no-store" behavior.
export default async function MarketplacePage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;

    const first = (value: string | string[] | undefined) =>
        Array.isArray(value) ? value[0] : value;

    const { products, pagination } = await getProducts({
        page: parseInt(first(params.page) || "1"),
        limit: 12,
        category: first(params.category) ?? null,
        minPrice: first(params.minPrice) ?? null,
        maxPrice: first(params.maxPrice) ?? null,
        minRating: first(params.minRating) ?? null,
        sort: first(params.sort) ?? null,
        search: first(params.search) ?? null,
    });

    // Strip Mongoose/ObjectId/Date types before handing to a Client Component,
    // matching the convention used in marketplace/[slug]/page.tsx.
    const initialProducts = JSON.parse(JSON.stringify(products));

    return (
        <React.Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--secondary-500)] border-t-transparent rounded-full" />
                </div>
            }
        >
            <MarketplaceListClient
                initialProducts={initialProducts}
                initialPagination={pagination}
            />
        </React.Suspense>
    );
}
