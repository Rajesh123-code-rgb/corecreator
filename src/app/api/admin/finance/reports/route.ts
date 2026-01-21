import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC Check with fallback for admin role
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_FINANCE)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        // 1. Revenue by Category (Unwind items to count per type)
        // Note: This is an estimation if orders have mixed types, but 'total' is on the order. 
        // Accurate way: Sum (price * quantity) of items.
        const categoryStats = await Order.aggregate([
            {
                $match: {
                    paymentStatus: { $in: ["paid", "confirmed"] },
                    status: { $nin: ["cancelled", "refunded"] }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.itemType",
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    count: { $sum: "$items.quantity" }
                }
            }
        ]);

        // 2. Refund Stats
        const refundStats = await Order.aggregate([
            { $match: { paymentStatus: { $in: ["refunded", "partially_refunded"] } } },
            {
                $group: {
                    _id: null,
                    totalRefunded: { $sum: "$refundDetails.amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Recent Transactions (for list view)
        const recentTransactions = await Order.find({ paymentStatus: "paid" })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("user", "name email")
            .select("orderNumber total createdAt items user");

        return NextResponse.json({
            revenueByCategory: categoryStats.map(s => ({
                category: s._id,
                revenue: s.revenue,
                count: s.count
            })),
            refunds: {
                amount: refundStats[0]?.totalRefunded || 0,
                count: refundStats[0]?.count || 0
            },
            recentTransactions
        });

    } catch (error) {
        console.error("Finance API Error:", error);
        return NextResponse.json({ error: "Failed to fetch finance report" }, { status: 500 });
    }
}
