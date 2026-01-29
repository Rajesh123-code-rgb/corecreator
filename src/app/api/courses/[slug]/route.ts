import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

        // Check for admin preview mode
        const { searchParams } = new URL(request.url);
        const previewMode = searchParams.get("preview");

        let query: any = { slug };

        // If preview=admin, check if user is admin and allow all non-draft statuses
        if (previewMode === "admin") {
            const session = await getServerSession(authOptions);
            if (session?.user?.role === "admin") {
                // Allow admin to view any course except drafts
                query.status = { $ne: "draft" };
            } else {
                // Not admin, only show published
                query.status = "published";
            }
        } else {
            // Normal users can only see published courses
            query.status = "published";
        }

        const course = await Course.findOne(query)
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
