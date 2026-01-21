import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongodb";
import Review from "@/lib/db/models/Review";
import Product from "@/lib/db/models/Product";
import { authOptions } from "@/lib/auth";

// GET reviews for a target
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const searchParams = request.nextUrl.searchParams;
        const targetType = searchParams.get("targetType") || "product";
        const targetId = searchParams.get("targetId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const sort = searchParams.get("sort") || "newest"; // newest, oldest, highest, lowest, helpful

        if (!targetId) {
            return NextResponse.json({ error: "Target ID is required" }, { status: 400 });
        }

        // Convert targetId to ObjectId for proper matching
        const targetObjectId = new mongoose.Types.ObjectId(targetId);
        const skip = (page - 1) * limit;

        // Build sort option
        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        switch (sort) {
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "highest":
                sortOption = { rating: -1, createdAt: -1 };
                break;
            case "lowest":
                sortOption = { rating: 1, createdAt: -1 };
                break;
            case "helpful":
                sortOption = { helpfulCount: -1, createdAt: -1 };
                break;
        }

        // Fetch reviews - use ObjectId for targetId
        const [reviews, total] = await Promise.all([
            Review.find({ targetType, targetId: targetObjectId, status: "approved" })
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate("user", "name avatar")
                .lean(),
            Review.countDocuments({ targetType, targetId: targetObjectId, status: "approved" }),
        ]);

        // Calculate rating distribution - use ObjectId for matching
        const ratingDistribution = await Review.aggregate([
            { $match: { targetType, targetId: targetObjectId, status: "approved" } },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
        ]);

        // Calculate average rating - use ObjectId for matching
        const stats = await Review.aggregate([
            { $match: { targetType, targetId: targetObjectId, status: "approved" } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        const reviewStats = stats[0] || { avgRating: 0, totalReviews: 0 };

        return NextResponse.json({
            reviews: JSON.parse(JSON.stringify(reviews)),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            stats: {
                avgRating: reviewStats.avgRating?.toFixed(1) || "0.0",
                totalReviews: reviewStats.totalReviews,
                distribution: ratingDistribution.reduce((acc: Record<number, number>, item: any) => {
                    acc[item._id] = item.count;
                    return acc;
                }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }),
            },
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

// POST create a new review
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be logged in to submit a review", requiresAuth: true },
                { status: 401 }
            );
        }

        await connectDB();

        const body = await request.json();
        const { targetType, targetId, rating, title, comment } = body;

        // Validate required fields
        if (!targetType || !targetId || !rating || !comment) {
            return NextResponse.json(
                { error: "Missing required fields: targetType, targetId, rating, comment" },
                { status: 400 }
            );
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        // Check if user already reviewed this target
        const existingReview = await Review.findOne({
            targetType,
            targetId,
            user: session.user.id,
        });

        if (existingReview) {
            return NextResponse.json(
                { error: "You have already reviewed this item" },
                { status: 400 }
            );
        }

        // Create the review
        const review = await Review.create({
            targetType,
            targetId,
            user: session.user.id,
            rating,
            title: title || "",
            comment,
            status: "approved", // Auto-approve for now
            isVerifiedPurchase: false, // TODO: Check order history
        });

        // Update product rating
        if (targetType === "product") {
            const targetObjectId = new mongoose.Types.ObjectId(targetId);
            const stats = await Review.aggregate([
                { $match: { targetType: "product", targetId: targetObjectId, status: "approved" } },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                        count: { $sum: 1 },
                    },
                },
            ]);

            if (stats[0]) {
                await Product.findByIdAndUpdate(targetId, {
                    rating: stats[0].avgRating,
                    reviewCount: stats[0].count,
                });
            }
        }

        // Populate user data for response
        const populatedReview = await Review.findById(review._id)
            .populate("user", "name avatar")
            .lean();

        return NextResponse.json({
            success: true,
            review: JSON.parse(JSON.stringify(populatedReview)),
        });
    } catch (error: any) {
        console.error("Error creating review:", error);
        if (error.code === 11000) {
            return NextResponse.json(
                { error: "You have already reviewed this item" },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }
}
