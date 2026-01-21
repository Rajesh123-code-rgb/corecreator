import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ReturnRequest from "@/lib/db/models/ReturnRequest";
import Order from "@/lib/db/models/Order";

// GET: List user's return requests
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const query: any = { user: session.user.id };
        if (status && status !== "all") {
            query.status = status;
        }

        const requests = await ReturnRequest.find(query)
            .populate("order", "orderNumber createdAt total")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("User Returns API Error:", error);
        return NextResponse.json({ error: "Failed to fetch return requests" }, { status: 500 });
    }
}

// POST: Create new return request
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, itemId, type, reason, description, evidence } = body;

        if (!orderId || !itemId || !type || !reason || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        // Verify order belongs to user and is delivered
        const order = await Order.findOne({
            _id: orderId,
            user: session.user.id,
            status: "delivered",
        });

        if (!order) {
            return NextResponse.json({
                error: "Order not found or not eligible for return/refund"
            }, { status: 404 });
        }

        // Find the item in the order (only products are eligible)
        const orderItem = order.items.find(
            (item: any) => item.itemId.toString() === itemId && item.itemType === "product"
        );

        if (!orderItem) {
            return NextResponse.json({
                error: "Product item not found in order or not eligible for return"
            }, { status: 404 });
        }

        // Check if return request already exists for this item
        const existingRequest = await ReturnRequest.findOne({
            order: orderId,
            "item.itemId": itemId,
            status: { $nin: ["rejected", "completed"] },
        });

        if (existingRequest) {
            return NextResponse.json({
                error: "A return request already exists for this item"
            }, { status: 400 });
        }

        // Create return request
        const returnRequest = new ReturnRequest({
            order: orderId,
            user: session.user.id,
            item: {
                itemId: orderItem.itemId,
                name: orderItem.name,
                price: orderItem.price,
                quantity: orderItem.quantity,
                image: orderItem.image,
                sellerId: orderItem.sellerId,
                sellerName: orderItem.sellerName,
            },
            type,
            reason,
            description,
            evidence: evidence || [],
            refundAmount: orderItem.price * orderItem.quantity,
        });

        await returnRequest.save();

        return NextResponse.json({
            success: true,
            request: returnRequest,
            message: "Return request submitted successfully"
        });
    } catch (error) {
        console.error("Create Return Request Error:", error);
        return NextResponse.json({ error: "Failed to create return request" }, { status: 500 });
    }
}
