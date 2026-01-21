import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Payout from "@/lib/db/models/Payout";
import Order from "@/lib/db/models/Order";
import User from "@/lib/db/models/User";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";
import { DEFAULT_PRICING_CONFIG } from "@/lib/utils/pricingEngine";
import mongoose from "mongoose";

// GET: List all payouts with filtering
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_FINANCE)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;
        const status = searchParams.get("status");

        const query: any = {};
        if (status && status !== "all") {
            query.status = status;
        }

        const [payouts, total] = await Promise.all([
            Payout.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("seller", "name email avatar")
                .populate("processedBy", "name")
                .lean(),
            Payout.countDocuments(query)
        ]);

        // Get summary stats
        const summaryStats = await Payout.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    total: { $sum: "$netEarnings" }
                }
            }
        ]);

        const summary = {
            pending: { count: 0, total: 0 },
            processing: { count: 0, total: 0 },
            completed: { count: 0, total: 0 },
            failed: { count: 0, total: 0 }
        };

        summaryStats.forEach(s => {
            if (summary[s._id as keyof typeof summary]) {
                summary[s._id as keyof typeof summary] = { count: s.count, total: s.total };
            }
        });

        return NextResponse.json({
            payouts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            summary
        });

    } catch (error) {
        console.error("Payouts API Error:", error);
        return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
    }
}

// POST: Create new payout for a seller
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_FINANCE)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const body = await request.json();
        const { sellerId, paymentMethod, paymentDetails } = body;

        if (!sellerId || !paymentMethod) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get seller info
        const seller = await User.findById(sellerId);
        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        // Get all pending order items for this seller
        const pendingOrders = await Order.find({
            paymentStatus: "paid",
            "items.sellerId": new mongoose.Types.ObjectId(sellerId),
            "items.payoutStatus": "pending"
        });

        if (pendingOrders.length === 0) {
            return NextResponse.json({ error: "No pending items to pay out" }, { status: 400 });
        }

        // Calculate totals
        let grossEarnings = 0;
        const orderIds: mongoose.Types.ObjectId[] = [];
        const periodStart = new Date();
        const periodEnd = new Date();

        pendingOrders.forEach(order => {
            order.items.forEach((item: any) => {
                if (item.sellerId?.toString() === sellerId && item.payoutStatus === "pending") {
                    grossEarnings += item.price * item.quantity;
                    if (!orderIds.includes(order._id)) {
                        orderIds.push(order._id);
                    }
                    // Track period
                    if (order.createdAt < periodStart) periodStart.setTime(order.createdAt.getTime());
                    if (order.createdAt > periodEnd) periodEnd.setTime(order.createdAt.getTime());
                }
            });
        });

        const platformFees = grossEarnings * (DEFAULT_PRICING_CONFIG.platformCommission / 100);
        const processingFees = grossEarnings * (DEFAULT_PRICING_CONFIG.paymentProcessingFee / 100);
        const netEarnings = grossEarnings - platformFees - processingFees;

        if (netEarnings < DEFAULT_PRICING_CONFIG.minimumPayout) {
            return NextResponse.json({
                error: `Minimum payout amount is $${DEFAULT_PRICING_CONFIG.minimumPayout}. Current: $${netEarnings.toFixed(2)}`
            }, { status: 400 });
        }

        // Create payout record
        const payout = await Payout.create({
            seller: sellerId,
            sellerEmail: seller.email,
            sellerName: seller.name,
            amount: netEarnings,
            currency: "INR",
            grossEarnings,
            platformFees: Math.round(platformFees * 100) / 100,
            processingFees: Math.round(processingFees * 100) / 100,
            netEarnings: Math.round(netEarnings * 100) / 100,
            status: "pending",
            paymentMethod,
            paymentDetails,
            periodStart,
            periodEnd,
            orderIds,
            orderCount: orderIds.length
        });

        // Update order items to 'included' status
        await Order.updateMany(
            {
                _id: { $in: orderIds },
                "items.sellerId": new mongoose.Types.ObjectId(sellerId),
                "items.payoutStatus": "pending"
            },
            {
                $set: {
                    "items.$[elem].payoutStatus": "included",
                    "items.$[elem].payoutId": payout._id
                }
            },
            {
                arrayFilters: [{
                    "elem.sellerId": new mongoose.Types.ObjectId(sellerId),
                    "elem.payoutStatus": "pending"
                }]
            }
        );

        return NextResponse.json({
            message: "Payout created successfully",
            payout
        }, { status: 201 });

    } catch (error) {
        console.error("Create Payout API Error:", error);
        return NextResponse.json({ error: "Failed to create payout" }, { status: 500 });
    }
}
