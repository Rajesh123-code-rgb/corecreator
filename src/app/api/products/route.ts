import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import Category from "@/lib/db/models/Category";

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

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const skip = (page - 1) * limit;

        // Filters
        const categoryParam = searchParams.get("category");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const sort = searchParams.get("sort") || "newest";
        const search = searchParams.get("search");
        const featured = searchParams.get("featured");

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
        const minRating = searchParams.get("minRating");
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

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Products API Error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
