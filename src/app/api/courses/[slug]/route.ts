import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import "@/lib/db/models/User"; // Ensure User model is registered

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await connectDB();

        const resolvedParams = await params;
        const { slug } = resolvedParams;

        const course = await Course.findOne({ slug, status: "published" })
            .populate("instructor", "name avatar bio rating students courses")
            .lean();

        if (!course) {
            return NextResponse.json(
                { error: "Course not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ course });
    } catch (error) {
        console.error("Get course error:", error);
        return NextResponse.json(
            { error: "Failed to fetch course" },
            { status: 500 }
        );
    }
}
