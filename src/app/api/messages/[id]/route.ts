import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Conversation from "@/lib/db/models/Conversation";
import Message from "@/lib/db/models/Message";
import mongoose from "mongoose";

// GET - Fetch messages in a conversation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const conversationId = id;
        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        }).populate("participants", "name avatar role");
        // ... (rest of GET body is fine, just need to update signature and await params)

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const [messages, total] = await Promise.all([
            Message.find({
                conversationId,
                isDeleted: false,
            })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("senderId", "name avatar")
                .lean(),
            Message.countDocuments({ conversationId, isDeleted: false }),
        ]);

        // Mark messages as read
        await Message.updateMany(
            {
                conversationId,
                senderId: { $ne: userId },
                "readBy.userId": { $ne: userId },
            },
            {
                $push: { readBy: { userId, readAt: new Date() } },
            }
        );

        // Reset unread count
        await Conversation.updateOne(
            { _id: conversationId },
            { $set: { [`unreadCount.${session.user.id}`]: 0 } }
        );

        return NextResponse.json({
            conversation: JSON.parse(JSON.stringify(conversation)),
            messages: JSON.parse(JSON.stringify(messages.reverse())),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

// POST - Send a new message
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const conversationId = id;
        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Verify user is a participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        const body = await request.json();
        const { content, attachments } = body;

        if (!content?.trim()) {
            return NextResponse.json({ error: "Message content is required" }, { status: 400 });
        }

        // Create message
        const message = await Message.create({
            conversationId,
            senderId: userId,
            content: content.trim(),
            attachments: attachments || [],
            readBy: [{ userId, readAt: new Date() }],
        });

        // Update conversation with last message
        const updateOps: Record<string, unknown> = {
            lastMessage: {
                content: content.trim().substring(0, 100),
                senderId: userId,
                sentAt: new Date(),
            },
        };

        // Increment unread for other participants
        for (const participantId of conversation.participants) {
            if (participantId.toString() !== session.user.id) {
                updateOps[`unreadCount.${participantId.toString()}`] =
                    (conversation.unreadCount?.get(participantId.toString()) || 0) + 1;
            }
        }

        await Conversation.updateOne({ _id: conversationId }, { $set: updateOps });

        await message.populate("senderId", "name avatar");

        return NextResponse.json({
            message: JSON.parse(JSON.stringify(message)),
        });
    } catch (error) {
        console.error("Failed to send message:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
