import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC Check with fallback for admin role
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_COURSES)) {
            return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const query: any = {};

        if (status && status !== "all") {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { instructorName: { $regex: search, $options: "i" } },
            ];
        }

        const [courses, total] = await Promise.all([
            Course.find(query)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("title slug thumbnail price instructorName status createdAt totalStudents averageRating")
                .lean(),
            Course.countDocuments(query),
        ]);

        return NextResponse.json({
            courses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin Courses API Error:", error);
        return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }
}
