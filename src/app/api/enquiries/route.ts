import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Enquiry from "@/lib/db/models/Enquiry";
import { logAudit } from "@/lib/db/models/AuditLog";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, message, type = "maintenance", source } = body;

        // Basic validation
        if (!name || !email || !phone) {
            return NextResponse.json(
                { error: "Name, Email and Phone are required" },
                { status: 400 }
            );
        }

        await connectDB();

        const enquiry = await Enquiry.create({
            name,
            email,
            phone,
            message,
            type,
            source,
            status: "new",
        });

        // Try to find a system admin user to attribute this to, or use a placeholder ID if possible
        // Ideally we should have a "System" user or allow null, but schema requires userId.
        // Let's check schema: userId required? Yes. 
        // We will find the first admin user to attach this log to, or just skip if no user found.
        // ACTUALLY: Public actions usually aren't "User Audits". But we can log it under a "System" user if we have one.
        // For now, let's skip logging public anonymous actions in the User Audit Log to avoid clutter/errors, 
        // OR we create a "System" user on the fly? No, too risky.

        // Let's just return success for now. The Admin Enquiry status update IS monitored.

        return NextResponse.json(
            { message: "Enquiry submitted successfully", id: enquiry._id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Enquiry submission error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
