import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Review from "@/lib/db/models/Review";

// GET - Fetch all reviews for admin moderation
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status") || "all";
        const targetType = searchParams.get("targetType") || "all";

        const query: Record<string, unknown> = {};
        if (status !== "all") query.status = status;
        if (targetType !== "all") query.targetType = targetType;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("user", "name email avatar")
                .lean(),
            Review.countDocuments(query),
        ]);

        // Get counts by status
        const [pending, approved, rejected, flagged] = await Promise.all([
            Review.countDocuments({ status: "pending" }),
            Review.countDocuments({ status: "approved" }),
            Review.countDocuments({ status: "rejected" }),
            Review.countDocuments({ status: "flagged" }),
        ]);

        return NextResponse.json({
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            stats: { pending, approved, rejected, flagged, total: pending + approved + rejected + flagged },
        });
    } catch (error) {
        console.error("Failed to fetch reviews:", error);
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

// PUT - Update review status (approve/reject/flag)
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { reviewId, status, bulkIds, bulkStatus } = body;

        // Bulk update
        if (bulkIds && Array.isArray(bulkIds) && bulkStatus) {
            await Review.updateMany(
                { _id: { $in: bulkIds } },
                { $set: { status: bulkStatus } }
            );
            return NextResponse.json({
                success: true,
                message: `${bulkIds.length} reviews updated to ${bulkStatus}`
            });
        }

        // Single update
        if (reviewId && status) {
            const review = await Review.findByIdAndUpdate(
                reviewId,
                { $set: { status } },
                { new: true }
            );

            if (!review) {
                return NextResponse.json({ error: "Review not found" }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                review,
                message: `Review ${status}`
            });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Failed to update review:", error);
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }
}

// DELETE - Delete a review
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get("id");

        if (!reviewId) {
            return NextResponse.json({ error: "Review ID required" }, { status: 400 });
        }

        await Review.findByIdAndDelete(reviewId);

        return NextResponse.json({ success: true, message: "Review deleted" });
    } catch (error) {
        console.error("Failed to delete review:", error);
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}
