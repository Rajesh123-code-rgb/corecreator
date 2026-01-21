import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";

// GET single course by ID
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await context.params;

        // Fetch course with ALL fields
        const course = await Course.findById(id).lean();

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        console.log("GET learningOutcomes:", course.learningOutcomes);

        return NextResponse.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
    }
}

// PATCH update course
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { id } = await context.params;
        const data = await req.json();

        console.log("PATCH request data:", {
            hasLearningOutcomes: !!data.learningOutcomes,
            learningOutcomesCount: data.learningOutcomes?.length,
            learningOutcomes: data.learningOutcomes,
            fullData: data
        });

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        console.log("BEFORE update - course.learningOutcomes:", course.learningOutcomes);

        // Try DIRECT assignment first
        course.learningOutcomes = data.learningOutcomes?.filter((o: string) => o.trim() !== "") || [];
        course.targetAudience = data.targetAudience?.filter((a: string) => a.trim() !== "") || [];
        course.prerequisites = data.prerequisites?.filter((p: string) => p.trim() !== "") || [];
        course.title = data.title;
        course.subtitle = data.subtitle;
        course.description = data.description;
        course.category = data.category;
        course.level = data.level?.toLowerCase();
        course.price = parseFloat(data.price);
        course.currency = data.currency;
        course.thumbnail = data.thumbnail;
        course.promoVideo = data.promoVideo;

        // Handle status change
        if (data.status) {
            if (data.status === "pending" && course.status !== "pending") {
                course.status = "pending";
                course.submittedAt = new Date();
                course.rejectionReason = undefined; // Clear any previous rejection
            } else if (data.status !== course.status) {
                course.status = data.status;
            }
        }

        console.log("AFTER assignment - course.learningOutcomes:", course.learningOutcomes);

        await course.save();

        console.log("AFTER save - course.learningOutcomes:", course.learningOutcomes);

        // Fetch fresh from DB
        const updatedCourse = await Course.findById(id).lean();

        console.log("Fresh from DB - learningOutcomes:", updatedCourse?.learningOutcomes);

        if (!updatedCourse) {
            return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
        }

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("Error updating course:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}
