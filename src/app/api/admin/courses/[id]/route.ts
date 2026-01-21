import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Basic RBAC check
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_COURSES)) {
            // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = params;

        const course = await Course.findById(id).populate("instructor", "name email");
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json({ course });
    } catch (error) {
        console.error("Fetch Course Error:", error);
        return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_COURSES)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = params;

        const deletedCourse = await Course.findByIdAndDelete(id);

        if (!deletedCourse) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Course deleted successfully" });
    } catch (error) {
        console.error("Delete Course Error:", error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}
