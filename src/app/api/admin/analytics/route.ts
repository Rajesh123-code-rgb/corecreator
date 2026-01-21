import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import User from "@/lib/db/models/User";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // RBAC Check with fallback for admin role
        if (!hasAdminPermission(session, PERMISSIONS.VIEW_ANALYTICS)) {
            return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
        }

        // Date Range: Last 30 Days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        // 1. Revenue Aggregation (Daily)
        const revenueStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    paymentStatus: { $in: ["paid", "confirmed"] }, // Only count secure revenue
                    status: { $nin: ["cancelled", "refunded"] } // Exclude cancelled/refunded
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. User Growth Aggregation (Daily)
        const userStats = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    users: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Merge Data for Charts (Fill missing days with 0)
        const chartData = [];
        for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const dayStr = d.toISOString().split("T")[0];
            const revData = revenueStats.find((r) => r._id === dayStr);
            const usrData = userStats.find((u) => u._id === dayStr);

            chartData.push({
                date: dayStr,
                revenue: revData ? revData.revenue : 0,
                orders: revData ? revData.orders : 0,
                users: usrData ? usrData.users : 0,
            });
        }

        // 3. Totals (Lifetime)
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);

        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();

        // 4. Attribution Stats (Source)
        const attributionStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: "$attribution.source",
                    count: { $sum: 1 },
                    revenue: { $sum: "$total" }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // 5. Funnel Stats
        // Visitors: Mock (since we don't track page views yet) - assume 10x of signups
        const totalFunnelUsers = userStats.reduce((acc, curr) => acc + curr.users, 0);
        const totalFunnelOrders = revenueStats.reduce((acc, curr) => acc + curr.orders, 0);
        const mockVisitors = Math.max(totalFunnelUsers * 15, 100);

        const funnelData = [
            { stage: "Visitors", count: mockVisitors, fill: "#8b5cf6" },
            { stage: "Signups", count: totalFunnelUsers, fill: "#3b82f6" },
            { stage: "Orders", count: totalFunnelOrders, fill: "#10b981" }
        ];

        return NextResponse.json({
            analytics: chartData,
            totals: {
                revenue: totalRevenue[0]?.total || 0,
                users: totalUsers,
                orders: totalOrders
            },
            attribution: attributionStats.map(s => ({
                source: s._id || "Direct",
                count: s.count,
                revenue: s.revenue
            })),
            funnel: funnelData
        });

    } catch (error) {
        console.error("Admin Analytics API Error:", error);
        return NextResponse.json({ error: "App Analytics Failed" }, { status: 500 });
    }
}
