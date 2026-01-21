import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";
import Order from "@/lib/db/models/Order";
import Review from "@/lib/db/models/Review";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Fetch Creator's Courses
        const courses = await Course.find({ instructor: userId }).lean();
        const publishedCoursesCount = courses.filter(c => c.status === "published").length;
        const draftCoursesCount = courses.filter(c => c.status === "draft").length;
        const reviewCoursesCount = 0; // Review status not in current schema
        const totalStudents = courses.reduce((acc, curr) => acc + (curr.totalStudents || 0), 0);

        // Fetch Creator's Products
        const products = await Product.find({ seller: userId }).lean();
        const activeProductsCount = products.filter(p => p.status === "active").length;
        const totalProductSales = products.reduce((acc, curr) => acc + (curr.salesCount || 0), 0);

        // Calculate Revenue (Estimated from counts)
        // A better way would be aggregation on Orders, but for now:
        const courseRevenue = courses.reduce((acc, curr) => acc + ((curr.totalStudents || 0) * curr.price), 0);
        const productRevenue = products.reduce((acc, curr) => acc + ((curr.salesCount || 0) * curr.price), 0);
        const totalRevenue = courseRevenue + productRevenue;

        // Fetch Recent Items
        const recentCourses = await Course.find({ instructor: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("title totalStudents averageRating price status")
            .lean();

        const recentProducts = await Product.find({ seller: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("name price salesCount status") // 'views' not tracked in schema yet?
            .lean();

        // Recent Orders (Simplified: fetch all recent paid orders and filter in memory or mock)
        // Correct way: Order.find({ "items.product": { $in: myProductIds } })
        const myProductIds = [
            ...courses.map(c => c._id),
            ...products.map(p => p._id)
        ];

        const recentOrders = await Order.find({
            "items.product": { $in: myProductIds },
            status: "paid"
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "name email") // Customer name
            .lean();

        // Format Orders
        const formattedOrders = recentOrders.map(order => {
            // Find the item that belongs to this creator
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const item = (order.items as any[]).find((i: any) =>
                myProductIds.some(id => id.toString() === i.product.toString())
            );

            // Find matching course/product for name
            const productDetails = courses.find(c => c._id.toString() === item.product.toString()) ||
                products.find(p => p._id.toString() === item.product.toString());

            return {
                id: order.orderNumber || order._id.toString(),
                customer: (order.user as any)?.name || "Guest",
                product: "title" in productDetails! ? productDetails.title : "name" in productDetails! ? productDetails.name : "Item",
                amount: item.price, // Item price snapshot
                type: item.kind === "Course" ? "course" : "artwork"
            };
        });

        // Fetch Real Activity Data
        const activities: Array<{
            id: string;
            type: "enrollment" | "purchase" | "review" | "milestone" | "comment";
            message: string;
            timestamp: Date;
            metadata?: Record<string, unknown>;
        }> = [];

        // 1. Get recent orders/enrollments for this creator's items
        const creatorOrders = await Order.find({
            "items.sellerId": userId,
            paymentStatus: "paid"
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("user", "name")
            .lean();

        for (const order of creatorOrders) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const myItems = (order.items as any[]).filter(
                (item: any) => item.sellerId?.toString() === userId.toString()
            );

            for (const item of myItems) {
                const activityType = item.itemType === "course" ? "enrollment" : "purchase";
                activities.push({
                    id: `order-${order._id}-${item.itemId}`,
                    type: activityType,
                    message: activityType === "enrollment"
                        ? `New student enrolled in your course`
                        : `Someone purchased your ${item.itemType}`,
                    timestamp: order.createdAt,
                    metadata: {
                        customerName: (order.user as any)?.name || "A customer",
                        itemName: item.name,
                        amount: item.price,
                        itemType: item.itemType
                    }
                });
            }
        }

        // 2. Get recent reviews for this creator's courses and products
        const myItemIds = [...courses.map(c => c._id), ...products.map(p => p._id)];

        const recentReviews = await Review.find({
            targetId: { $in: myItemIds },
            status: "approved"
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("user", "name")
            .lean();

        for (const review of recentReviews) {
            // Find the item name
            const course = courses.find(c => c._id.toString() === review.targetId.toString());
            const product = products.find(p => p._id.toString() === review.targetId.toString());
            const itemName = course?.title || product?.name || "your item";

            activities.push({
                id: `review-${review._id}`,
                type: "review",
                message: `New ${review.rating}-star review received`,
                timestamp: review.createdAt,
                metadata: {
                    rating: review.rating,
                    itemName,
                    reviewerName: (review.user as any)?.name || "A customer",
                    comment: review.comment?.substring(0, 100)
                }
            });
        }

        // Sort all activities by timestamp descending and limit to 10
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const recentActivity = activities.slice(0, 10);

        return NextResponse.json({
            stats: {
                totalStudents,
                coursesPublished: publishedCoursesCount,
                coursesDraft: draftCoursesCount,
                coursesReview: reviewCoursesCount,
                artworksListed: activeProductsCount,
                revenue: totalRevenue
            },
            recentCourses: recentCourses.map(c => ({
                title: c.title,
                students: c.totalStudents,
                rating: c.averageRating,
                revenue: (c.totalStudents || 0) * c.price,
                status: c.status
            })),
            recentProducts: recentProducts.map(p => ({
                title: p.name,
                price: p.price,
                views: 0, // Mock or add field later
                sales: p.salesCount,
                status: p.status
            })),
            recentOrders: formattedOrders,
            recentActivity
        });

    } catch (error) {
        console.error("Creator Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
