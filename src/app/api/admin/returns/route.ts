import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ReturnRequest from "@/lib/db/models/ReturnRequest";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

// GET: List all return requests (admin)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_ORDERS)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const query: any = {};
        if (status && status !== "all") {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { requestNumber: { $regex: search, $options: "i" } },
                { "item.name": { $regex: search, $options: "i" } },
            ];
        }

        const [requests, total] = await Promise.all([
            ReturnRequest.find(query)
                .populate("order", "orderNumber createdAt total status")
                .populate("user", "name email avatar")
                .populate("item.sellerId", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ReturnRequest.countDocuments(query),
        ]);

        return NextResponse.json({
            requests,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin Returns API Error:", error);
        return NextResponse.json({ error: "Failed to fetch return requests" }, { status: 500 });
    }
}
