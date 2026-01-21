import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import User from "@/lib/db/models/User";
import Product from "@/lib/db/models/Product";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_ORDERS)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        await connectDB();

        const order = await Order.findById(id)
            .populate("user", "name email phone avatar createdAt")
            .lean();

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Fetch seller details for each item
        const sellerIds = [...new Set(order.items.map((item: any) => item.sellerId?.toString()).filter(Boolean))];
        const sellers = await User.find({ _id: { $in: sellerIds } })
            .select("name email avatar")
            .lean();

        const sellerMap = new Map(sellers.map((s: any) => [s._id.toString(), s]));

        // Enrich items with seller details
        const enrichedItems = order.items.map((item: any) => ({
            ...item,
            seller: item.sellerId ? sellerMap.get(item.sellerId.toString()) : null,
        }));

        return NextResponse.json({
            order: {
                ...order,
                items: enrichedItems,
            },
        });
    } catch (error) {
        console.error("Admin Order Detail API Error:", error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}
