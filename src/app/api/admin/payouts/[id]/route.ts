import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Payout from "@/lib/db/models/Payout";
import Order from "@/lib/db/models/Order";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";
import mongoose from "mongoose";

// GET: Get payout details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_FINANCE)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const payout = await Payout.findById(id)
            .populate("seller", "name email avatar studioProfile")
            .populate("processedBy", "name email")
            .lean();

        if (!payout) {
            return NextResponse.json({ error: "Payout not found" }, { status: 404 });
        }

        // Get associated orders
        const orders = await Order.find({ _id: { $in: payout.orderIds } })
            .select("orderNumber total createdAt items")
            .lean();

        return NextResponse.json({ payout, orders });

    } catch (error) {
        console.error("Payout Detail API Error:", error);
        return NextResponse.json({ error: "Failed to fetch payout" }, { status: 500 });
    }
}

// PATCH: Update payout status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_FINANCE)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const body = await request.json();
        const { status, transactionId, notes, failureReason } = body;

        const payout = await Payout.findById(id);
        if (!payout) {
            return NextResponse.json({ error: "Payout not found" }, { status: 404 });
        }

        // Update payout
        payout.status = status;
        if (transactionId) {
            payout.paymentDetails = {
                ...payout.paymentDetails,
                transactionId,
                notes
            };
        }
        if (failureReason) {
            payout.failureReason = failureReason;
        }

        if (status === "completed") {
            payout.processedBy = new mongoose.Types.ObjectId(session.user.id);
            payout.processedAt = new Date();

            // Update order items to 'paid'
            await Order.updateMany(
                { "items.payoutId": payout._id },
                { $set: { "items.$[elem].payoutStatus": "paid" } },
                { arrayFilters: [{ "elem.payoutId": payout._id }] }
            );
        } else if (status === "failed" || status === "cancelled") {
            // Revert order items to 'pending'
            await Order.updateMany(
                { "items.payoutId": payout._id },
                {
                    $set: { "items.$[elem].payoutStatus": "pending" },
                    $unset: { "items.$[elem].payoutId": "" }
                },
                { arrayFilters: [{ "elem.payoutId": payout._id }] }
            );
        }

        await payout.save();

        return NextResponse.json({
            message: "Payout updated successfully",
            payout
        });

    } catch (error) {
        console.error("Update Payout API Error:", error);
        return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
    }
}
