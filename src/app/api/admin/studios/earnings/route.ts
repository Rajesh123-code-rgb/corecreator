import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import User from "@/lib/db/models/User";
import Payout from "@/lib/db/models/Payout";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";
import { DEFAULT_PRICING_CONFIG } from "@/lib/utils/pricingEngine";

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
        const search = searchParams.get("search");

        // Get all studios (users with role 'studio')
        const studioQuery: any = { role: "studio" };
        if (search) {
            studioQuery.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const studios = await User.find(studioQuery)
            .select("name email avatar studioProfile createdAt")
            .lean();

        // Get earnings data for each studio
        const studioEarnings = await Promise.all(
            studios.map(async (studio) => {
                // Aggregate orders containing items from this seller
                const orderStats = await Order.aggregate([
                    {
                        $match: {
                            paymentStatus: "paid",
                            "items.sellerId": studio._id
                        }
                    },
                    { $unwind: "$items" },
                    { $match: { "items.sellerId": studio._id } },
                    {
                        $group: {
                            _id: null,
                            totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
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

                // Get payout totals
                const payoutStats = await Payout.aggregate([
                    { $match: { seller: studio._id, status: "completed" } },
                    {
                        $group: {
                            _id: null,
                            totalPaidOut: { $sum: "$netEarnings" },
                            payoutCount: { $sum: 1 }
                        }
                    }
                ]);

                const stats = orderStats[0] || { totalSales: 0, orderCount: 0, pendingItems: 0, pendingAmount: 0 };
                const payouts = payoutStats[0] || { totalPaidOut: 0, payoutCount: 0 };

                // Calculate fees
                const platformFee = stats.pendingAmount * (DEFAULT_PRICING_CONFIG.platformCommission / 100);
                const processingFee = stats.pendingAmount * (DEFAULT_PRICING_CONFIG.paymentProcessingFee / 100);
                const netPending = stats.pendingAmount - platformFee - processingFee;

                return {
                    _id: studio._id,
                    name: studio.name,
                    email: studio.email,
                    avatar: studio.avatar,
                    studioName: studio.studioProfile?.name,
                    joinedAt: studio.createdAt,
                    totalSales: Math.round(stats.totalSales * 100) / 100,
                    orderCount: stats.orderCount,
                    pendingItems: stats.pendingItems,
                    pendingAmount: Math.round(stats.pendingAmount * 100) / 100,
                    pendingPayout: Math.round(netPending * 100) / 100,
                    totalPaidOut: Math.round(payouts.totalPaidOut * 100) / 100,
                    payoutCount: payouts.payoutCount,
                    canPayout: netPending >= DEFAULT_PRICING_CONFIG.minimumPayout
                };
            })
        );

        // Calculate platform totals
        const platformTotals = {
            totalStudios: studios.length,
            totalPendingPayouts: studioEarnings.reduce((sum, s) => sum + s.pendingPayout, 0),
            totalPaidOut: studioEarnings.reduce((sum, s) => sum + s.totalPaidOut, 0),
            studiosWithPending: studioEarnings.filter(s => s.pendingPayout > 0).length
        };

        return NextResponse.json({
            studios: studioEarnings,
            totals: platformTotals,
            config: {
                platformCommission: DEFAULT_PRICING_CONFIG.platformCommission,
                processingFee: DEFAULT_PRICING_CONFIG.paymentProcessingFee,
                minimumPayout: DEFAULT_PRICING_CONFIG.minimumPayout
            }
        });

    } catch (error) {
        console.error("Studio Earnings API Error:", error);
        return NextResponse.json({ error: "Failed to fetch studio earnings" }, { status: 500 });
    }
}
