
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Assuming session.user.id is available, otherwise we might need to find user by email first
        // But for getting orders, we usually query by user ID.
        // Let's assume Order model stores user ID.

        // Use user ID from session if available, else find user by email.
        const userId = session.user.id;

        if (!userId) {
            return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
        }

        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ orders });
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
