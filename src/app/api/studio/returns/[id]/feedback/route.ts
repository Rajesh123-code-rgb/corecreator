import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ReturnRequest from "@/lib/db/models/ReturnRequest";
import mongoose from "mongoose";

// POST: Add studio feedback to a return request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { message } = body;

        if (!message || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Verify this return request belongs to studio's product
        const returnRequest = await ReturnRequest.findOne({
            _id: id,
            "item.sellerId": userId,
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        // Add feedback
        const feedback = {
            submittedBy: userId,
            submittedAt: new Date(),
            message: message.trim(),
        };

        returnRequest.studioFeedback.push(feedback);
        await returnRequest.save();

        return NextResponse.json({
            success: true,
            feedback,
            message: "Feedback submitted successfully",
        });
    } catch (error) {
        console.error("Studio Feedback Error:", error);
        return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
    }
}
