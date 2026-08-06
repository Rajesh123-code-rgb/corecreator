import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/productSearch";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const result = await getProducts({
            page: parseInt(searchParams.get("page") || "1"),
            limit: parseInt(searchParams.get("limit") || "12"),
            category: searchParams.get("category"),
            minPrice: searchParams.get("minPrice"),
            maxPrice: searchParams.get("maxPrice"),
            minRating: searchParams.get("minRating"),
            sort: searchParams.get("sort"),
            search: searchParams.get("search"),
            featured: searchParams.get("featured"),
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Products API Error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
