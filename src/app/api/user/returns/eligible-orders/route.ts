import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";

// GET: List user's orders eligible for return (delivered products only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Get delivered orders with product items
        const orders = await Order.find({
            user: session.user.id,
            status: "delivered",
            "items.itemType": "product",
        })
            .select("orderNumber items createdAt total shippingAddress")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Filter to only include product items
        const eligibleOrders = orders.map((order: any) => ({
            ...order,
            items: order.items.filter((item: any) => item.itemType === "product"),
        })).filter((order: any) => order.items.length > 0);

        return NextResponse.json({ orders: eligibleOrders });
    } catch (error) {
        console.error("Eligible Orders API Error:", error);
        return NextResponse.json({ error: "Failed to fetch eligible orders" }, { status: 500 });
    }
}
