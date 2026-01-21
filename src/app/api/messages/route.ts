import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Conversation from "@/lib/db/models/Conversation";
import Message from "@/lib/db/models/Message";
import mongoose from "mongoose";

// GET - Fetch user's conversations
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const [conversations, total] = await Promise.all([
            Conversation.find({
                participants: userId,
                isActive: true,
            })
                .sort({ "lastMessage.sentAt": -1, updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("participants", "name avatar role")
                .lean(),
            Conversation.countDocuments({
                participants: userId,
                isActive: true,
            }),
        ]);

        // Calculate total unread
        let totalUnread = 0;
        const conversationsWithUnread = conversations.map((conv: any) => {
            const unread = conv.unreadCount?.get?.(session.user.id) || conv.unreadCount?.[session.user.id] || 0;
            totalUnread += unread;
            return {
                ...conv,
                unreadCount: unread,
                otherParticipant: conv.participants.find((p: any) => p._id.toString() !== session.user.id),
            };
        });

        return NextResponse.json({
            conversations: JSON.parse(JSON.stringify(conversationsWithUnread)),
            totalUnread,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch conversations:", error);
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
}

// POST - Create new conversation or get existing
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { recipientId, subject, type = "direct", relatedTo } = body;

        if (!recipientId) {
            return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 });
        }

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const recipientObjId = new mongoose.Types.ObjectId(recipientId);

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, recipientObjId] },
            type,
            isActive: true,
        });

        if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
                participants: [userId, recipientObjId],
                type,
                subject,
                relatedTo,
                unreadCount: new Map([[recipientId, 0], [session.user.id, 0]]),
            });
        }

        await conversation.populate("participants", "name avatar role");

        return NextResponse.json({
            conversation: JSON.parse(JSON.stringify(conversation)),
        });
    } catch (error) {
        console.error("Failed to create conversation:", error);
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
}
