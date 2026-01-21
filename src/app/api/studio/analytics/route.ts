import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";
import Order from "@/lib/db/models/Order";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "30days";

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (range) {
            case "30days":
                startDate.setDate(now.getDate() - 30);
                break;
            case "3months":
                startDate.setMonth(now.getMonth() - 3);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case "alltime":
                startDate = new Date(0); // Beginning of time
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        // Get instructor's courses and products
        const [courses, products] = await Promise.all([
            Course.find({ instructor: userId }).select("_id price totalStudents averageRating title").lean(),
            Product.find({ seller: userId }).select("_id price salesCount rating name").lean()
        ]);

        const courseIds = courses.map(c => c._id);
        const productIds = products.map(p => p._id);
        const allItemIds = [...courseIds, ...productIds];

        // Get orders for revenue calculation
        const orders = await Order.find({
            "items.product": { $in: allItemIds },
            status: "paid",
            createdAt: { $gte: startDate }
        })
            .select("items createdAt totalAmount")
            .populate("user", "name email avatar")
            .lean();

        // Calculate revenue by month
        const revenueByMonth: Record<string, number> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        orders.forEach(order => {
            const month = monthNames[new Date(order.createdAt).getMonth()];
            const year = new Date(order.createdAt).getFullYear();
            const key = range === "year" || range === "alltime" ? `${month} ${year}` : month;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const relevantItems = (order.items as any[]).filter((item: any) =>
                allItemIds.some(id => id.toString() === item.product.toString())
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const revenue = relevantItems.reduce((sum: number, item: any) => sum + item.price, 0);
            revenueByMonth[key] = (revenueByMonth[key] || 0) + revenue;
        });

        // Format revenue data for chart
        const revenueData = Object.entries(revenueByMonth)
            .map(([month, amount]) => ({ month, amount }))
            .slice(-6); // Last 6 months

        // Calculate total stats
        const totalStudents = courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
        const totalRevenue = Object.values(revenueByMonth).reduce((sum, val) => sum + val, 0);
        const avgRating = courses.length > 0
            ? courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.length
            : 0;

        // Recent enrollments (students who bought courses)
        const recentEnrollments = orders
            .slice(0, 5)
            .map(order => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const courseItem = (order.items as any[]).find((item: any) =>
                    courseIds.some(id => id.toString() === item.product.toString())
                );

                if (!courseItem) return null;

                const course = courses.find(c => c._id.toString() === courseItem.product.toString());

                return {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    id: (order as any)._id?.toString(),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    name: (order.user as any)?.name || "Unknown",
                    course: course?.title || "Course",
                    progress: 0, // Would need to fetch from progress tracking
                    lastActive: "Recently",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    avatar: ((order.user as any)?.name || "U").substring(0, 2).toUpperCase()
                };
            })
            .filter(Boolean);

        // Course performance
        const coursePerformance = courses.map(course => {
            const relevantOrders = orders.filter(order =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (order.items as any[]).some((item: any) =>
                    item.product.toString() === course._id.toString()
                )
            );

            const sales = relevantOrders.length;
            const revenue = sales * course.price;

            return {
                title: course.title,
                views: (course.totalStudents || 0) * 10, // Estimate views as 10x enrollments
                sales,
                revenue,
                rating: course.averageRating || 0
            };
        }).sort((a, b) => b.revenue - a.revenue);

        return NextResponse.json({
            stats: {
                totalRevenue,
                totalStudents,
                avgRating: Math.round(avgRating * 10) / 10,
                activeCourses: courses.filter(c => c.totalStudents && c.totalStudents > 0).length
            },
            revenueData,
            students: recentEnrollments,
            coursePerformance
        });

    } catch (error) {
        console.error("Studio Analytics API Error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
