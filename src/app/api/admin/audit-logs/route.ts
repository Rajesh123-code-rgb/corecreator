import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import AuditLog from "@/lib/db/models/AuditLog";
import User from "@/lib/db/models/User"; // Ensure User model is registered
import mongoose from "mongoose";

// GET - Fetch audit logs
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const action = searchParams.get("action");
        const resource = searchParams.get("resource");
        const severity = searchParams.get("severity");
        const userId = searchParams.get("userId");
        const search = searchParams.get("search");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const query: Record<string, unknown> = {};
        if (action) query.action = action;
        if (resource) query.resource = resource;
        if (severity) query.severity = severity;
        if (userId) query.userId = userId;

        // If search is provided, find users with matching name/email
        if (search) {
            const User = mongoose.models.User || mongoose.model("User"); // Avoid circular dep issues
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            }).select("_id");

            const userIds = users.map((u: any) => u._id);
            query.userId = { $in: userIds };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, unknown>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, unknown>).$lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("userId", "name email avatar role")
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        // Get unique actions and resources for filters
        const [actions, resources] = await Promise.all([
            AuditLog.distinct("action"),
            AuditLog.distinct("resource"),
        ]);

        return NextResponse.json({
            logs: JSON.parse(JSON.stringify(logs)),
            filters: { actions, resources },
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }
}
