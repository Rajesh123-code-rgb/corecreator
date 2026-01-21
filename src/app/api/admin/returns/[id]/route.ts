import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ReturnRequest from "@/lib/db/models/ReturnRequest";
import Order from "@/lib/db/models/Order";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";
import mongoose from "mongoose";

// GET: Get single return request details
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

        const returnRequest = await ReturnRequest.findById(id)
            .populate("order", "orderNumber createdAt total status shippingAddress paymentStatus paymentMethod")
            .populate("user", "name email phone avatar createdAt")
            .populate("item.sellerId", "name email avatar")
            .populate("adminReview.reviewedBy", "name email")
            .populate("studioFeedback.submittedBy", "name email")
            .lean();

        if (!returnRequest) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        return NextResponse.json({ request: returnRequest });
    } catch (error) {
        console.error("Admin Return Detail Error:", error);
        return NextResponse.json({ error: "Failed to fetch return request" }, { status: 500 });
    }
}

// PATCH: Update return request (approve/reject)
export async function PATCH(
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
        const body = await request.json();
        const { status, decision, notes, refundAmount } = body;

        await connectDB();

        const returnRequest = await ReturnRequest.findById(id);
        if (!returnRequest) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        const updates: any = {};

        // Update status
        if (status) {
            updates.status = status;
        }

        // Admin review decision
        if (decision) {
            updates.adminReview = {
                reviewedBy: new mongoose.Types.ObjectId(session.user.id),
                reviewedAt: new Date(),
                decision,
                notes: notes || "",
                refundAmount: decision === "approved" ? (refundAmount || returnRequest.refundAmount) : 0,
            };
            updates.status = decision === "approved" ? "approved" : "rejected";

            // If approved, update order status and item payout status
            if (decision === "approved") {
                const order = await Order.findById(returnRequest.order);
                if (order) {
                    let allItemsRefunded = true;
                    let itemFound = false;

                    // Update specific item status
                    order.items.forEach((item: any) => {
                        if (item.itemId.toString() === returnRequest.item.itemId.toString()) {
                            item.payoutStatus = "refunded";
                            itemFound = true;
                        }
                        if (item.payoutStatus !== "refunded") {
                            allItemsRefunded = false;
                        }
                    });

                    // Determine overall order payment status
                    const newPaymentStatus = allItemsRefunded ? "refunded" : "partially_refunded";

                    // Update order
                    await Order.findByIdAndUpdate(returnRequest.order, {
                        $set: {
                            items: order.items,
                            paymentStatus: newPaymentStatus,
                            "refundDetails.amount": (order.refundDetails?.amount || 0) + (refundAmount || returnRequest.refundAmount),
                            "refundDetails.status": "processed",
                            "refundDetails.processedAt": new Date(),
                        },
                    });
                }
            }
        }

        const updatedRequest = await ReturnRequest.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        )
            .populate("order", "orderNumber")
            .populate("user", "name email");

        return NextResponse.json({
            success: true,
            request: updatedRequest,
        });
    } catch (error) {
        console.error("Admin Update Return Error:", error);
        return NextResponse.json({ error: "Failed to update return request" }, { status: 500 });
    }
}
