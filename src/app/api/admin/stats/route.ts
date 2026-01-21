import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";
import Order from "@/lib/db/models/Order";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "studio")) { // Allowing studio for now if needed, or stick to admin
            // Check if user has explicit admin permissions or is super admin
            const isAdmin = session?.user?.role === "admin" || session?.user?.adminRole;
            if (!isAdmin) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        await connectDB();

        // 1. Stats
        const [totalUsers, totalCourses, totalProducts, totalRevenueResult] = await Promise.all([
            User.countDocuments(),
            Course.countDocuments({ status: "published" }),
            Product.countDocuments({ status: "active" }),
            Order.aggregate([
                { $match: { status: "paid" } },
                { $group: { _id: null, total: { $sum: "$total" } } }
            ])
        ]);

        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // 2. Recent Users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("name email role createdAt")
            .lean();

        // 3. Recent Orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "name")
            .lean();

        // 4. Activity Feed (Mock/Derived)
        const activityFeed = [
            ...recentUsers.map(u => ({ type: "user", message: `New user registration: ${u.name}`, time: u.createdAt, icon: "UserPlus" })),
            ...recentOrders.map(o => ({ type: "order", message: `New order #${o.orderNumber || o._id}`, time: o.createdAt, icon: "ShoppingCart" }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

        // 5. Top Products (Simplified)
        // Fetch top courses by enrollment
        const topCourses = await Course.find({ status: "published" })
            .sort({ totalStudents: -1 })
            .limit(3)
            .select("title totalStudents price")
            .lean();

        const topProducts = await Product.find({ status: "active" })
            .sort({ salesCount: -1 })
            .limit(3)
            .select("name salesCount price")
            .lean();

        const topSelling = [
            ...topCourses.map(c => ({ name: c.title, sales: c.totalStudents, revenue: c.totalStudents * c.price, type: "course" })),
            ...topProducts.map(p => ({ name: p.name, sales: p.salesCount, revenue: p.salesCount * p.price, type: "product" }))
        ].sort((a, b) => b.revenue - a.revenue).slice(0, 4);

        return NextResponse.json({
            stats: {
                totalUsers,
                totalRevenue,
                activeCourses: totalCourses,
                productsListed: totalProducts
            },
            recentUsers: recentUsers.map(u => ({
                name: u.name,
                email: u.email,
                role: u.role,
                joinedAgo: new Date(u.createdAt).toLocaleDateString() // simplified
            })),
            recentOrders: recentOrders.map(o => ({
                id: o.orderNumber || o._id.toString(),
                customer: (o.user as any)?.name || "Guest",
                amount: o.total,
                status: o.paymentStatus === "paid" ? "completed" : o.status,
                time: new Date(o.createdAt).toLocaleDateString()
            })),
            topProducts: topSelling,
            activityFeed: activityFeed.map(a => ({
                ...a,
                time: new Date(a.time).toLocaleTimeString() // simplified
            }))
        });

    } catch (error) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
    }
}
