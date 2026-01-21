import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";
import Workshop from "@/lib/db/models/Workshop";

interface RecommendationItem {
    type: "course" | "product" | "workshop";
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    slug: string;
    rating?: number;
    reason: string;
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "all"; // all, courses, products, workshops
        const limit = parseInt(searchParams.get("limit") || "8");
        const context = searchParams.get("context") || "home"; // home, course, product, user

        const recommendations: RecommendationItem[] = [];

        // For MVP, we use a scoring algorithm based on:
        // - Rating (higher is better)
        // - Recent activity (newer items get boost)
        // - Popularity (more sales/enrollments)
        // In production, this would use ML models

        if (type === "all" || type === "courses") {
            const courses = await Course.find({ status: "published" })
                .sort({ averageRating: -1, totalStudents: -1, createdAt: -1 })
                .limit(type === "all" ? 4 : limit)
                .select("title subtitle thumbnail price averageRating slug category totalStudents")
                .lean();

            courses.forEach((course) => {
                recommendations.push({
                    type: "course",
                    id: course._id.toString(),
                    title: course.title,
                    description: course.subtitle || "",
                    image: course.thumbnail || "",
                    price: course.price,
                    slug: course.slug,
                    rating: course.averageRating,
                    reason: getRecommendationReason("course", course as unknown as Record<string, unknown>),
                });
            });
        }

        if (type === "all" || type === "products") {
            const products = await Product.find({ status: "active" })
                .sort({ rating: -1, salesCount: -1, createdAt: -1 })
                .limit(type === "all" ? 4 : limit)
                .select("name shortDescription images price rating slug category")
                .lean();

            products.forEach((product) => {
                const primaryImage = product.images?.find((img: { isPrimary: boolean }) => img.isPrimary) || product.images?.[0];
                recommendations.push({
                    type: "product",
                    id: product._id.toString(),
                    title: product.name,
                    description: product.shortDescription || "",
                    image: primaryImage?.url || "",
                    price: product.price,
                    slug: product.slug,
                    rating: product.rating,
                    reason: getRecommendationReason("product", product as unknown as Record<string, unknown>),
                });
            });
        }

        if (type === "all" || type === "workshops") {
            const workshops = await Workshop.find({
                status: "published",
                date: { $gte: new Date() }
            })
                .sort({ date: 1 })
                .limit(type === "all" ? 4 : limit)
                .select("title description thumbnail price slug category date")
                .lean();

            workshops.forEach((workshop) => {
                recommendations.push({
                    type: "workshop",
                    id: workshop._id.toString(),
                    title: workshop.title,
                    description: workshop.description?.substring(0, 150) || "",
                    image: workshop.thumbnail || "",
                    price: workshop.price || 0,
                    slug: workshop.slug,
                    reason: "Upcoming workshop",
                });
            });
        }

        // Shuffle recommendations for variety (simple Fisher-Yates)
        for (let i = recommendations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [recommendations[i], recommendations[j]] = [recommendations[j], recommendations[i]];
        }

        return NextResponse.json({
            recommendations: recommendations.slice(0, limit),
            context,
        });
    } catch (error) {
        console.error("Recommendations API Error:", error);
        return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
    }
}

function getRecommendationReason(type: string, item: Record<string, unknown>): string {
    const reasons = {
        highRated: "Highly rated by learners",
        popular: "Popular choice",
        trending: "Trending now",
        newRelease: "New release",
        bestSeller: "Best seller",
    };

    const rating = item.rating as number | undefined;
    const salesCount = item.salesCount as number | undefined;
    const totalStudents = item.totalStudents as number | undefined;
    const createdAt = item.createdAt as Date | undefined;

    if (rating && rating >= 4.5) return reasons.highRated;
    if ((salesCount && salesCount > 50) || (totalStudents && totalStudents > 100)) return reasons.popular;
    if (createdAt && new Date().getTime() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000) {
        return reasons.newRelease;
    }
    return reasons.trending;
}
