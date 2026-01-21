import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import Workshop from "@/lib/db/models/Workshop";

interface SearchResult {
    type: "product" | "course" | "workshop";
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    slug: string;
    category: string;
    rating?: number;
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";
        const type = searchParams.get("type") || "all"; // all, products, courses, workshops
        const category = searchParams.get("category");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const sort = searchParams.get("sort") || "relevance";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");

        if (!query || query.length < 2) {
            return NextResponse.json({
                results: [],
                pagination: { page: 1, limit, total: 0, pages: 0 },
                message: "Search query must be at least 2 characters"
            });
        }

        const results: SearchResult[] = [];
        let totalCount = 0;

        // Build base query for text search
        const textQuery: Record<string, unknown> = {
            $text: { $search: query }
        };

        // Add price filter if provided
        if (minPrice || maxPrice) {
            textQuery.price = {};
            if (minPrice) (textQuery.price as Record<string, number>).$gte = parseFloat(minPrice);
            if (maxPrice) (textQuery.price as Record<string, number>).$lte = parseFloat(maxPrice);
        }

        // Add category filter if provided
        if (category) {
            textQuery.category = category;
        }

        // Sort options
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getSortOption = (sortType: string): Record<string, any> => {
            switch (sortType) {
                case "price-low": return { price: 1 };
                case "price-high": return { price: -1 };
                case "rating": return { averageRating: -1 };
                case "newest": return { createdAt: -1 };
                case "popular": return { totalStudents: -1, salesCount: -1 };
                default: return { score: { $meta: "textScore" } };
            }
        };

        const sortOption = getSortOption(sort);

        // Search Products
        if (type === "all" || type === "products") {
            const productQuery = { ...textQuery, status: "active" };
            const products = await Product.find(productQuery)
                .sort(sortOption)
                .limit(type === "all" ? 4 : limit)
                .skip(type === "products" ? (page - 1) * limit : 0)
                .select("name slug shortDescription images price rating category")
                .lean();

            const productCount = await Product.countDocuments(productQuery);
            if (type === "products") totalCount = productCount;

            products.forEach((product) => {
                const primaryImage = product.images?.find((img: { isPrimary: boolean }) => img.isPrimary) || product.images?.[0];
                results.push({
                    type: "product",
                    id: product._id.toString(),
                    title: product.name,
                    description: product.shortDescription || "",
                    image: primaryImage?.url || "",
                    price: product.price,
                    slug: product.slug,
                    category: product.category,
                    rating: product.rating,
                });
            });
        }

        // Search Courses
        if (type === "all" || type === "courses") {
            const courseQuery = { ...textQuery, status: "published" };
            const courses = await Course.find(courseQuery)
                .sort(sortOption)
                .limit(type === "all" ? 4 : limit)
                .skip(type === "courses" ? (page - 1) * limit : 0)
                .select("title slug subtitle thumbnail price rating category")
                .lean();

            const courseCount = await Course.countDocuments(courseQuery);
            if (type === "courses") totalCount = courseCount;

            courses.forEach((course) => {
                results.push({
                    type: "course",
                    id: course._id.toString(),
                    title: course.title,
                    description: course.subtitle || "",
                    image: course.thumbnail || "",
                    price: course.price,
                    slug: course.slug,
                    category: course.category,
                    rating: course.averageRating,
                });
            });
        }

        // Search Workshops
        if (type === "all" || type === "workshops") {
            // Create workshop query without price filter (workshops have different pricing)
            const workshopQuery: Record<string, unknown> = {
                $text: { $search: query },
                status: "published"
            };
            if (category) workshopQuery.category = category;

            const workshops = await Workshop.find(workshopQuery)
                .sort({ startDate: 1 })
                .limit(type === "all" ? 4 : limit)
                .skip(type === "workshops" ? (page - 1) * limit : 0)
                .select("title slug description thumbnail price category startDate")
                .lean();

            const workshopCount = await Workshop.countDocuments(workshopQuery);
            if (type === "workshops") totalCount = workshopCount;

            workshops.forEach((workshop) => {
                results.push({
                    type: "workshop",
                    id: workshop._id.toString(),
                    title: workshop.title,
                    description: workshop.description?.substring(0, 150) || "",
                    image: workshop.thumbnail || "",
                    price: workshop.price || 0,
                    slug: workshop.slug,
                    category: workshop.category,
                });
            });
        }

        // For "all" type, get total counts from each collection
        if (type === "all") {
            const [productTotal, courseTotal, workshopTotal] = await Promise.all([
                Product.countDocuments({ ...textQuery, status: "active" }),
                Course.countDocuments({ ...textQuery, status: "published" }),
                Workshop.countDocuments({ $text: { $search: query }, status: "published" }),
            ]);
            totalCount = productTotal + courseTotal + workshopTotal;
        }

        return NextResponse.json({
            results,
            counts: type === "all" ? {
                products: results.filter(r => r.type === "product").length,
                courses: results.filter(r => r.type === "course").length,
                workshops: results.filter(r => r.type === "workshop").length,
            } : undefined,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
