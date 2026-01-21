import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Notification from "@/lib/db/models/Notification";

// GET - Fetch notifications based on role
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const unreadOnly = searchParams.get("unread") === "true";
        const context = searchParams.get("context"); // "user", "studio", "admin"

        let query: Record<string, unknown> = {};

        // Determine query based on context and role
        if (context === "admin" && session.user.role === "admin") {
            query = { recipientModel: "Admin" };
            // Optional: Filter by specific admin ID if needed, but usually admins see all admin notifs
            // or specific targetted ones. For now, let's assume all admins see "Admin" notifications.
        } else if (context === "studio" && session.user.role === "studio") {
            // Use user ID as studio ID if they are same, or fetch studio ID.
            // Assuming session.user.id is the link.
            query = { recipientModel: "Studio", recipientId: session.user.id };
        } else {
            // Default to user notifications
            query = { recipientModel: "User", recipientId: session.user.id };
        }

        if (unreadOnly) {
            query.read = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ ...query, read: false }),
        ]);

        return NextResponse.json({
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { notificationIds, markAllRead, context } = body;

        let query: Record<string, unknown> = {};

        // Validate context permissions similar to GET
        if (context === "admin" && session.user.role === "admin") {
            query.recipientModel = "Admin";
        } else if (context === "studio" && session.user.role === "studio") {
            query.recipientModel = "Studio";
            query.recipientId = session.user.id;
        } else {
            query.recipientModel = "User";
            query.recipientId = session.user.id;
        }

        if (markAllRead) {
            await Notification.updateMany(
                { ...query, read: false },
                { $set: { read: true, readAt: new Date() } }
            );
            return NextResponse.json({ success: true, message: "All notifications marked as read" });
        }

        if (notificationIds && Array.isArray(notificationIds)) {
            await Notification.updateMany(
                {
                    _id: { $in: notificationIds },
                    ...query
                },
                { $set: { read: true, readAt: new Date() } }
            );
            return NextResponse.json({ success: true, message: "Notifications marked as read" });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Failed to update notifications:", error);
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get("id");
        const deleteRead = searchParams.get("deleteRead") === "true";
        const context = searchParams.get("context");

        let query: Record<string, unknown> = {};

        if (context === "admin" && session.user.role === "admin") {
            query.recipientModel = "Admin";
        } else if (context === "studio" && session.user.role === "studio") {
            query.recipientModel = "Studio";
            query.recipientId = session.user.id;
        } else {
            query.recipientModel = "User";
            query.recipientId = session.user.id;
        }

        if (deleteRead) {
            await Notification.deleteMany({ ...query, read: true });
            return NextResponse.json({ success: true, message: "Read notifications deleted" });
        }

        if (notificationId) {
            await Notification.deleteOne({ _id: notificationId, ...query });
            return NextResponse.json({ success: true, message: "Notification deleted" });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("Failed to delete notifications:", error);
        return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
    }
}
