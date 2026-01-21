import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Ticket from "@/lib/db/models/Ticket";

// GET - Fetch user's tickets
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
        const status = searchParams.get("status");

        const query: Record<string, unknown> = { userId: session.user.id };
        if (status && status !== "all") {
            query.status = status;
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("assignedTo", "name")
                .lean(),
            Ticket.countDocuments(query),
        ]);

        // Get counts by status
        const [open, inProgress, resolved] = await Promise.all([
            Ticket.countDocuments({ userId: session.user.id, status: "open" }),
            Ticket.countDocuments({ userId: session.user.id, status: "in_progress" }),
            Ticket.countDocuments({ userId: session.user.id, status: "resolved" }),
        ]);

        return NextResponse.json({
            tickets: JSON.parse(JSON.stringify(tickets)),
            stats: { open, inProgress, resolved, total },
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Failed to fetch tickets:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

// POST - Create new ticket
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { subject, description, category, priority, relatedTo } = body;

        if (!subject || !description) {
            return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
        }

        const ticket = await Ticket.create({
            userId: session.user.id,
            subject,
            description,
            category: category || "other",
            priority: priority || "medium",
            relatedTo,
        });

        return NextResponse.json({
            success: true,
            ticket: JSON.parse(JSON.stringify(ticket)),
        });
    } catch (error) {
        console.error("Failed to create ticket:", error);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}
