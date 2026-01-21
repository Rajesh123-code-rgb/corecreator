import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import Payout from "@/lib/db/models/Payout";
import { DEFAULT_PRICING_CONFIG } from "@/lib/utils/pricingEngine";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only studio users can access their own earnings
        if (session.user.role !== "studio" && session.user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const sellerId = session.user.id;

        // Get current month boundaries
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Aggregate all-time earnings from paid orders
        const allTimeStats = await Order.aggregate([
            {
                $match: {
                    paymentStatus: { $in: ["paid", "partially_refunded"] },
                    "items.sellerId": session.user.id
                }
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.sellerId": session.user.id,
                    "items.payoutStatus": { $ne: "refunded" }
                }
            },
            {
                $group: {
                    _id: null,
                    grossSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    orderCount: { $sum: 1 },
                    pendingItems: {
                        $sum: { $cond: [{ $eq: ["$items.payoutStatus", "pending"] }, 1, 0] }
                    },
                    pendingAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$items.payoutStatus", "pending"] },
                                { $multiply: ["$items.price", "$items.quantity"] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Aggregate this month's earnings
        const monthStats = await Order.aggregate([
            {
                $match: {
                    paymentStatus: { $in: ["paid", "partially_refunded"] },
                    createdAt: { $gte: monthStart, $lte: monthEnd },
                    "items.sellerId": session.user.id
                }
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.sellerId": session.user.id,
                    "items.payoutStatus": { $ne: "refunded" }
                }
            },
            {
                $group: {
                    _id: null,
                    grossSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        // Get payout history
        const payouts = await Payout.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("amount netEarnings status paymentMethod createdAt processedAt")
            .lean();

        // Calculate total paid out
        const paidOutStats = await Payout.aggregate([
            { $match: { seller: session.user.id, status: "completed" } },
            {
                $group: {
                    _id: null,
                    totalPaidOut: { $sum: "$netEarnings" },
                    payoutCount: { $sum: 1 }
                }
            }
        ]);

        // Recent transactions (orders with this seller's items)
        const recentOrders = await Order.find({
            paymentStatus: { $in: ["paid", "partially_refunded"] },
            "items.sellerId": session.user.id
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("orderNumber total items createdAt paymentDetails")
            .lean();

        // Extract only this seller's items from orders
        const transactions = recentOrders.map(order => {
            const sellerItems = (order.items as any[]).filter(
                item => item.sellerId?.toString() === sellerId
            );
            const sellerTotal = sellerItems.reduce(
                (sum, item) => sum + (item.price * item.quantity), 0
            );

            // Determine status for this specific seller's items in this order
            const allRefunded = sellerItems.length > 0 && sellerItems.every(i => i.payoutStatus === "refunded");
            const anyRefunded = sellerItems.some(i => i.payoutStatus === "refunded");

            let status = sellerItems[0]?.payoutStatus || "pending";
            if (allRefunded) status = "refunded";
            else if (anyRefunded) status = "partially_refunded";

            return {
                orderNumber: order.orderNumber,
                date: order.createdAt,
                items: sellerItems.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
                grossAmount: sellerTotal,
                payoutStatus: status
            };
        });

        // Calculate commission breakdown
        const stats = allTimeStats[0] || { grossSales: 0, orderCount: 0, pendingItems: 0, pendingAmount: 0 };
        const month = monthStats[0] || { grossSales: 0, orderCount: 0 };
        const paid = paidOutStats[0] || { totalPaidOut: 0, payoutCount: 0 };

        const platformCommission = stats.pendingAmount * (DEFAULT_PRICING_CONFIG.platformCommission / 100);
        const processingFee = stats.pendingAmount * (DEFAULT_PRICING_CONFIG.paymentProcessingFee / 100);
        const availableForPayout = stats.pendingAmount - platformCommission - processingFee;

        return NextResponse.json({
            earnings: {
                totalGrossSales: Math.round(stats.grossSales * 100) / 100,
                totalOrders: stats.orderCount,
                thisMonthGross: Math.round(month.grossSales * 100) / 100,
                thisMonthOrders: month.orderCount,
                pendingAmount: Math.round(stats.pendingAmount * 100) / 100,
                platformCommission: Math.round(platformCommission * 100) / 100,
                processingFee: Math.round(processingFee * 100) / 100,
                availableForPayout: Math.round(availableForPayout * 100) / 100,
                totalPaidOut: Math.round(paid.totalPaidOut * 100) / 100,
                payoutCount: paid.payoutCount
            },
            config: {
                platformCommissionRate: DEFAULT_PRICING_CONFIG.platformCommission,
                processingFeeRate: DEFAULT_PRICING_CONFIG.paymentProcessingFee,
                minimumPayout: DEFAULT_PRICING_CONFIG.minimumPayout,
                currency: "INR"
            },
            transactions,
            payouts: payouts.map(p => ({
                ...p,
                _id: p._id.toString()
            }))
        });

    } catch (error) {
        console.error("Studio Earnings API Error:", error);
        return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 });
    }
}
