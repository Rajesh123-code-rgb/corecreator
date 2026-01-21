import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/db/models/Ticket";
import mongoose from "mongoose";

// GET - Fetch all tickets for admin
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");

        const query: Record<string, unknown> = {};
        if (status && status !== "all") query.status = status;
        if (priority && priority !== "all") query.priority = priority;

        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .sort({ priority: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("userId", "name email avatar")
                .populate("assignedTo", "name")
                .lean(),
            Ticket.countDocuments(query),
        ]);

        const [open, inProgress, waitingCustomer, resolved] = await Promise.all([
            Ticket.countDocuments({ status: "open" }),
            Ticket.countDocuments({ status: "in_progress" }),
            Ticket.countDocuments({ status: "waiting_customer" }),
            Ticket.countDocuments({ status: "resolved" }),
        ]);

        return NextResponse.json({
            tickets: JSON.parse(JSON.stringify(tickets)),
            stats: { open, inProgress, waitingCustomer, resolved, total },
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Failed to fetch tickets:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

// PUT - Update ticket (status, priority, assignment)
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { ticketId, status, priority, assignedTo, reply } = body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        if (status) {
            ticket.status = status;
            if (status === "resolved") ticket.resolvedAt = new Date();
            if (status === "closed") ticket.closedAt = new Date();
        }
        if (priority) ticket.priority = priority;
        if (assignedTo) ticket.assignedTo = assignedTo;

        if (reply) {
            ticket.replies.push({
                userId: new mongoose.Types.ObjectId(session.user.id),
                message: reply,
                isStaff: true,
                createdAt: new Date(),
            });
            if (ticket.status === "open") {
                ticket.status = "in_progress";
            }
        }

        await ticket.save();

        return NextResponse.json({
            success: true,
            ticket: JSON.parse(JSON.stringify(ticket)),
        });
    } catch (error) {
        console.error("Failed to update ticket:", error);
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }
}
