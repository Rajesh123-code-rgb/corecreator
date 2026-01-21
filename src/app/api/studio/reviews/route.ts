import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Review from "@/lib/db/models/Review";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import Workshop from "@/lib/db/models/Workshop";
import mongoose from "mongoose";

// GET - Fetch reviews for studio's products/courses
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "studio") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const targetType = searchParams.get("targetType") || "all";

        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Find all products/courses/workshops belonging to this studio
        const [products, courses, workshops] = await Promise.all([
            Product.find({ seller: userId }).select("_id").lean(),
            Course.find({ instructor: userId }).select("_id").lean(),
            Workshop.find({ instructor: userId }).select("_id").lean(),
        ]);

        const productIds = products.map(p => p._id);
        const courseIds = courses.map(c => c._id);
        const workshopIds = workshops.map(w => w._id);

        // Build query based on filter
        const orConditions: Record<string, unknown>[] = [];
        if (targetType === "all" || targetType === "product") {
            orConditions.push({ targetType: "product", targetId: { $in: productIds } });
        }
        if (targetType === "all" || targetType === "course") {
            orConditions.push({ targetType: "course", targetId: { $in: courseIds } });
        }
        if (targetType === "all" || targetType === "workshop") {
            orConditions.push({ targetType: "workshop", targetId: { $in: workshopIds } });
        }

        if (orConditions.length === 0) {
            return NextResponse.json({
                reviews: [],
                stats: { avgRating: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
                pagination: { page: 1, limit, total: 0, pages: 0 },
            });
        }

        const query = { $or: orConditions, status: "approved" };

        const [reviews, total, stats, distribution] = await Promise.all([
            Review.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("user", "name avatar")
                .lean(),
            Review.countDocuments(query),
            Review.aggregate([
                { $match: query },
                { $group: { _id: null, avgRating: { $avg: "$rating" } } },
            ]),
            Review.aggregate([
                { $match: query },
                { $group: { _id: "$rating", count: { $sum: 1 } } },
            ]),
        ]);

        const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        distribution.forEach((d: { _id: number; count: number }) => {
            ratingDistribution[d._id] = d.count;
        });

        return NextResponse.json({
            reviews: JSON.parse(JSON.stringify(reviews)),
            stats: {
                avgRating: stats[0]?.avgRating || 0,
                total,
                distribution: ratingDistribution,
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch studio reviews:", error);
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}
