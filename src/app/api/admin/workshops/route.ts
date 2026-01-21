
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Workshop from "@/lib/db/models/Workshop";
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
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;
        const search = searchParams.get("search");

        const query: any = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { instructorName: { $regex: search, $options: "i" } },
            ];
        }

        const [workshops, total] = await Promise.all([
            Workshop.find(query)
                .sort({ date: 1 }) // Sort by upcoming dates
                .skip(skip)
                .limit(limit)
                .lean(),
            Workshop.countDocuments(query),
        ]);

        return NextResponse.json({
            workshops,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin Workshops API Error:", error);
        return NextResponse.json({ error: "Failed to fetch workshops" }, { status: 500 });
    }
}
