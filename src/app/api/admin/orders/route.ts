import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import User from "@/lib/db/models/User"; // Ensure User model is registered
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC Check with fallback for admin role
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_ORDERS)) {
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
            query.paymentStatus = status;
        }

        if (search) {
            // Simple regex search on orderNumber
            query.orderNumber = { $regex: search, $options: "i" };
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("user", "name email")
                .lean(),
            Order.countDocuments(query),
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin Orders API Error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
