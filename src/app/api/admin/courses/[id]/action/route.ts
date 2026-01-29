import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action, rejectionReason } = await request.json();
        const { id } = params;

        if (!id || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // RBAC Check
        const userPermissions = session.user.permissions || [];
        const isSuper = session.user.adminRole === "super";
        const hasPermission = isSuper || userPermissions.includes(PERMISSIONS.APPROVE_COURSES);

        if (!hasPermission) {
            return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
        }

        await connectDB();

        let updateQuery: any = {};

        if (action === "approve" || action === "unblock") {
            updateQuery = {
                status: "published",
                isPublished: true,
                publishedAt: new Date(),
                rejectionReason: "" // Clear any previous rejection
            };
        } else if (action === "reject") {
            if (!rejectionReason) {
                return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
            }
            updateQuery = {
                status: "rejected",
                isPublished: false,
                rejectionReason: rejectionReason
            };
        } else if (action === "block") {
            updateQuery = {
                status: "blocked",
                isPublished: false
            };
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            updateQuery,
            { new: true }
        ).select("title status isPublished rejectionReason");

        if (!updatedCourse) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // TODO: Send email notification to instructor about approval/rejection

        return NextResponse.json({
            success: true,
            course: updatedCourse,
            message: `Course ${action}d successfully`
        });

    } catch (error) {
        console.error("Admin Course Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
