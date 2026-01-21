import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ReturnRequest from "@/lib/db/models/ReturnRequest";
import mongoose from "mongoose";

// GET: List return requests for studio's products
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const query: any = { "item.sellerId": userId };
        if (status && status !== "all") {
            query.status = status;
        }

        const requests = await ReturnRequest.find(query)
            .populate("order", "orderNumber createdAt total")
            .populate("user", "name email avatar")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("Studio Returns API Error:", error);
        return NextResponse.json({ error: "Failed to fetch return requests" }, { status: 500 });
    }
}
