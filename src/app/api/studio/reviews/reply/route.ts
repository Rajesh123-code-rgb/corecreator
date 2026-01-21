import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Review from "@/lib/db/models/Review";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import Workshop from "@/lib/db/models/Workshop";
import mongoose from "mongoose";

// POST - Reply to a review
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "studio") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { reviewId, comment } = body;

        if (!reviewId || !comment) {
            return NextResponse.json({ error: "Review ID and comment are required" }, { status: 400 });
        }

        // Get the review
        const review = await Review.findById(reviewId);

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Verify the studio owns the product/course being reviewed
        const userId = new mongoose.Types.ObjectId(session.user.id);
        let isOwner = false;

        if (review.targetType === "product") {
            const product = await Product.findOne({ _id: review.targetId, seller: userId });
            isOwner = !!product;
        } else if (review.targetType === "course") {
            const course = await Course.findOne({ _id: review.targetId, instructor: userId });
            isOwner = !!course;
        } else if (review.targetType === "workshop") {
            const workshop = await Workshop.findOne({ _id: review.targetId, instructor: userId });
            isOwner = !!workshop;
        }

        if (!isOwner) {
            return NextResponse.json({ error: "Not authorized to reply to this review" }, { status: 403 });
        }

        // Update the review with seller response
        review.sellerResponse = {
            comment,
            respondedAt: new Date(),
        };
        await review.save();

        return NextResponse.json({
            success: true,
            message: "Reply added successfully",
            review: JSON.parse(JSON.stringify(review)),
        });
    } catch (error) {
        console.error("Failed to reply to review:", error);
        return NextResponse.json({ error: "Failed to reply to review" }, { status: 500 });
    }
}
