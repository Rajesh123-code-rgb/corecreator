import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import User from "@/lib/db/models/User";
import Product from "@/lib/db/models/Product";

// GET - Generate reports
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "sales";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const format = searchParams.get("format") || "json";

        const dateQuery: Record<string, unknown> = {};
        if (startDate) dateQuery.$gte = new Date(startDate);
        if (endDate) dateQuery.$lte = new Date(endDate);

        let reportData: unknown = {};

        switch (type) {
            case "sales": {
                const [orders, dailySales, topProducts] = await Promise.all([
                    Order.find(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {})
                        .select("total status createdAt paymentStatus")
                        .lean(),
                    Order.aggregate([
                        { $match: Object.keys(dateQuery).length ? { createdAt: dateQuery } : {} },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                revenue: { $sum: "$total" },
                                orders: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ]),
                    Order.aggregate([
                        { $match: Object.keys(dateQuery).length ? { createdAt: dateQuery, status: { $ne: "cancelled" } } : { status: { $ne: "cancelled" } } },
                        { $unwind: "$items" },
                        {
                            $group: {
                                _id: "$items.productId",
                                name: { $first: "$items.name" },
                                quantity: { $sum: "$items.quantity" },
                                revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                            },
                        },
                        { $sort: { revenue: -1 } },
                        { $limit: 10 },
                    ]),
                ]);

                const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
                const completedOrders = orders.filter(o => o.status === "delivered").length;

                reportData = {
                    summary: {
                        totalOrders: orders.length,
                        completedOrders,
                        totalRevenue,
                        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                    },
                    dailySales,
                    topProducts,
                };
                break;
            }

            case "users": {
                const [users, usersByRole, newUsersDaily] = await Promise.all([
                    User.countDocuments(),
                    User.aggregate([
                        { $group: { _id: "$role", count: { $sum: 1 } } },
                    ]),
                    User.aggregate([
                        { $match: Object.keys(dateQuery).length ? { createdAt: dateQuery } : {} },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ]),
                ]);

                reportData = {
                    summary: { totalUsers: users, byRole: usersByRole },
                    newUsersDaily,
                };
                break;
            }

            case "products": {
                const [products, byCategory, byStatus] = await Promise.all([
                    Product.countDocuments(),
                    Product.aggregate([
                        { $group: { _id: "$category", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                    ]),
                    Product.aggregate([
                        { $group: { _id: "$status", count: { $sum: 1 } } },
                    ]),
                ]);

                reportData = {
                    summary: { totalProducts: products, byCategory, byStatus },
                };
                break;
            }

            default:
                return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
        }

        // Handle CSV export
        if (format === "csv" && type === "sales") {
            const sales = (reportData as { dailySales: { _id: string; revenue: number; orders: number }[] }).dailySales;
            const csvContent = [
                "Date,Revenue,Orders",
                ...sales.map((d: { _id: string; revenue: number; orders: number }) => `${d._id},${d.revenue},${d.orders}`),
            ].join("\n");

            return new NextResponse(csvContent, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="sales-report-${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        return NextResponse.json({
            type,
            dateRange: { start: startDate, end: endDate },
            data: reportData,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to generate report:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
