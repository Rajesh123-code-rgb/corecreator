import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/db/models/Ticket";
import mongoose from "mongoose";

// GET - Fetch single ticket
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

        const ticket = await Ticket.findOne({
            _id: id,
            userId: session.user.id,
        })
            .populate("assignedTo", "name avatar")
            .populate("replies.userId", "name avatar")
            .lean();
        // ... (rest fine)

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json({ ticket: JSON.parse(JSON.stringify(ticket)) });
    } catch (error) {
        console.error("Failed to fetch ticket:", error);
        return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
    }
}

// POST - Add reply to ticket
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

        const body = await request.json();
        const { message, attachments } = body;

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const ticket = await Ticket.findOne({
            _id: id,
            userId: session.user.id,
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        // Add reply
        ticket.replies.push({
            userId: new mongoose.Types.ObjectId(session.user.id),
            message: message.trim(),
            attachments: attachments || [],
            isStaff: false,
            createdAt: new Date(),
        });

        // Update status if it was waiting for customer
        if (ticket.status === "waiting_customer") {
            ticket.status = "in_progress";
        }

        await ticket.save();

        return NextResponse.json({
            success: true,
            ticket: JSON.parse(JSON.stringify(ticket)),
        });
    } catch (error) {
        console.error("Failed to add reply:", error);
        return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
    }
}
