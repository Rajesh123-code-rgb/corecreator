import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Enquiry from "@/lib/db/models/Enquiry";
import { logAudit } from "@/lib/db/models/AuditLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const enquiries = await Enquiry.find({})
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 for now

        return NextResponse.json({ enquiries });
    } catch (error) {
        console.error("Fetch enquires error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "ID and Status required" }, { status: 400 });
        }

        await connectDB();

        const updatedEnquiry = await Enquiry.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedEnquiry) {
            return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Status updated", enquiry: updatedEnquiry });
    } catch (error) {
        console.error("Update enquiry error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        await connectDB();
        const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

        if (deletedEnquiry) {
            await logAudit({
                userId: session.user.id,
                action: "DELETE_ENQUIRY",
                resource: "Enquiry",
                resourceId: id,
                description: `Deleted enquiry from ${deletedEnquiry.email}`,
                severity: "warning"
            });
        }

        return NextResponse.json({ message: "Enquiry deleted" });
    } catch (error) {
        console.error("Delete enquiry error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
