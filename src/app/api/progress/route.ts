import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Progress from "@/lib/db/models/Progress";
import mongoose from "mongoose";

// GET - Retrieve progress for a specific lesson or all lessons in a course
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("courseId");
        const lessonId = searchParams.get("lessonId");

        if (!courseId) {
            return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
        }

        const query: Record<string, unknown> = {
            userId: new mongoose.Types.ObjectId(session.user.id),
            courseId: new mongoose.Types.ObjectId(courseId),
        };

        if (lessonId) {
            query.lessonId = lessonId;
        }

        const progress = lessonId
            ? await Progress.findOne(query)
            : await Progress.find(query);

        return NextResponse.json({ progress });
    } catch (error) {
        console.error("Get progress error:", error);
        return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
    }
}

// POST - Save or update progress
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { courseId, lessonId, watchTime, duration } = body;

        if (!courseId || !lessonId) {
            return NextResponse.json(
                { error: "Course ID and Lesson ID are required" },
                { status: 400 }
            );
        }

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const courseObjectId = new mongoose.Types.ObjectId(courseId);

        // Find existing progress or create new
        const existingProgress = await Progress.findOne({
            userId,
            courseId: courseObjectId,
            lessonId,
        });

        if (existingProgress) {
            // Update if new watchTime is greater
            if (watchTime > existingProgress.watchTime) {
                existingProgress.watchTime = watchTime;
                existingProgress.duration = duration || existingProgress.duration;
                existingProgress.lastWatched = new Date();
                await existingProgress.save();
            }
            return NextResponse.json({ progress: existingProgress });
        }

        // Create new progress
        const progress = new Progress({
            userId,
            courseId: courseObjectId,
            lessonId,
            watchTime: watchTime || 0,
            duration: duration || 0,
            lastWatched: new Date(),
        });

        await progress.save();

        return NextResponse.json({ progress });
    } catch (error) {
        console.error("Save progress error:", error);
        return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
    }
}
