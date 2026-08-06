// Server-only: queries MongoDB directly. Import from Server Components or
// route handlers - never from a "use client" file (use /api/products there).
//
// Extracted verbatim from src/app/api/products/route.ts so the same query can
// serve both the API route (for client-side re-fetching on filter change) and
// Server Components rendering the initial listing.
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import Category from "@/lib/db/models/Category";

export interface ProductSearchFilters {
    page?: number;
    limit?: number;
    category?: string | null;
    minPrice?: string | null;
    maxPrice?: string | null;
    minRating?: string | null;
    sort?: string | null;
    search?: string | null;
    featured?: string | null;
}

export interface ProductSearchResult {
    products: Record<string, unknown>[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getCategoryFilterRegex(categoryParam: string) {
    if (!categoryParam || categoryParam === "all") return null;

    // Search for predefined category document
    const catDoc = await Category.findOne({
        type: "product",
        $or: [
            { slug: categoryParam.toLowerCase() },
            { name: { $regex: new RegExp(`^${escapeRegExp(categoryParam)}$`, "i") } }
        ]
    }).lean();

    const possibleValues = new Set<string>();
    possibleValues.add(categoryParam);
    possibleValues.add(categoryParam.replace(/-/g, " "));
    possibleValues.add(categoryParam.replace(/ /g, "-"));

    if (catDoc) {
        if (catDoc.name) possibleValues.add(catDoc.name);
        if (catDoc.slug) possibleValues.add(catDoc.slug);
    }

    // Build flexible patterns
    const patterns = Array.from(possibleValues).map(val =>
        `^${escapeRegExp(val).replace(/\\-/g, "[\\s\\-]")}s?$`
    );

    return new RegExp(patterns.join("|"), "i");
}

export async function getProducts(filters: ProductSearchFilters = {}): Promise<ProductSearchResult> {
    await connectDB();

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const categoryParam = filters.category;
    const minPrice = filters.minPrice;
    const maxPrice = filters.maxPrice;
    const sort = filters.sort || "newest";
    const search = filters.search;
    const featured = filters.featured;

    // Build query - only show active products that are in stock
    const query: Record<string, unknown> = {
        status: "active",
        $or: [
            { quantity: { $gt: 0 } },           // Has stock
            { hasVariants: true },               // Has variants (check variant stock separately)
            { quantity: { $exists: false } }     // Legacy products without quantity field
        ]
    };

    if (categoryParam && categoryParam !== "all") {
        const catRegex = await getCategoryFilterRegex(categoryParam);
        if (catRegex) {
            query.category = { $regex: catRegex };
        }
    }

    if (featured === "true") query.isFeatured = true;
    const minRating = filters.minRating;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) (query.price as Record<string, number>).$gte = parseFloat(minPrice);
        if (maxPrice) (query.price as Record<string, number>).$lte = parseFloat(maxPrice);
    }

    if (search) {
        query.$text = { $search: search };
    }

    // Sort options
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
        case "price-low": sortOption = { price: 1 }; break;
        case "price-high": sortOption = { price: -1 }; break;
        case "popular": sortOption = { salesCount: -1 }; break;
        case "rating": sortOption = { rating: -1 }; break;
        default: sortOption = { createdAt: -1 };
    }

    // Execute query
    const [products, total] = await Promise.all([
        Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .select("-description -metaTitle -metaDescription")
            .populate("seller", "name avatar bio")
            .lean(),
        Product.countDocuments(query),
    ]);

    return {
        products: products as unknown as Record<string, unknown>[],
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}
