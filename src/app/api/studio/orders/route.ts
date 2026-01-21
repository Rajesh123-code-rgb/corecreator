import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        // Build query - find orders containing items from this seller
        const query: Record<string, unknown> = {
            "items.sellerId": userId,
            paymentStatus: "paid", // Only show paid orders
        };

        if (status && status !== "all") {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate("user", "name email avatar")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        // Filter items to only show this seller's items
        const filteredOrders = orders.map(order => ({
            ...order,
            items: order.items.filter((item: any) =>
                item.sellerId?.toString() === session.user.id
            ),
            // Recalculate total for this seller's items only
            sellerTotal: order.items
                .filter((item: any) => item.sellerId?.toString() === session.user.id)
                .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        }));

        return NextResponse.json({ orders: filteredOrders });
    } catch (error) {
        console.error("Studio Orders API Error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
