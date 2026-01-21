import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import mongoose from "mongoose";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, tracking } = body;

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Verify this order contains items from this seller
        const order = await Order.findOne({
            _id: id,
            "items.sellerId": userId,
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Build update object
        const update: Record<string, unknown> = {};

        if (status) {
            update.status = status;

            // Add to tracking history
            const historyEntry = {
                status,
                timestamp: new Date(),
                message: getStatusMessage(status),
                updatedBy: userId,
            };

            if (!order.trackingHistory) {
                order.trackingHistory = [];
            }
            order.trackingHistory.push(historyEntry);
            update.trackingHistory = order.trackingHistory;
        }

        if (tracking) {
            update.shippingTracking = {
                carrier: tracking.carrier,
                trackingNumber: tracking.trackingNumber,
                trackingUrl: tracking.trackingUrl || undefined,
            };

            // Add shipping tracking history entry
            const trackingHistoryEntry = {
                status: "shipped",
                timestamp: new Date(),
                message: `Shipped via ${tracking.carrier}. Tracking: ${tracking.trackingNumber}`,
                updatedBy: userId,
            };

            if (!order.trackingHistory) {
                order.trackingHistory = [];
            }
            order.trackingHistory.push(trackingHistoryEntry);
            update.trackingHistory = order.trackingHistory;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

function getStatusMessage(status: string): string {
    switch (status) {
        case "confirmed":
            return "Order has been confirmed";
        case "processing":
            return "Order is being prepared";
        case "shipped":
            return "Order has been shipped";
        case "delivered":
            return "Order has been delivered";
        case "cancelled":
            return "Order has been cancelled";
        default:
            return `Order status updated to ${status}`;
    }
}
