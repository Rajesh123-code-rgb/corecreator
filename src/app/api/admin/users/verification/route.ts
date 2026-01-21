import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    try {
        await connectDB();

        // Build query - if "all", don't filter by status, just get all with kyc.submittedAt
        const query: Record<string, unknown> = status === "all"
            ? { "kyc.submittedAt": { $exists: true } }
            : { "kyc.status": status };

        const users = await User.find(query)
            .select("name email role kyc isVerified")
            .sort({ "kyc.submittedAt": -1 }); // Newest first

        return NextResponse.json({ users });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId, action, reason } = await req.json();

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const timestamp = new Date();

        if (action === "approve") {
            user.kyc.status = "approved";
            user.kyc.verifiedAt = timestamp;
            user.isVerified = true;
            // Mark all submitted documents as verified
            user.kyc.documents.forEach((doc: any) => doc.verified = true);
        } else if (action === "reject") {
            user.kyc.status = "rejected";
            user.kyc.rejectionReason = reason;
            user.isVerified = false;
        }

        await user.save();

        // TODO: Send email notification to user about status change

        return NextResponse.json({ success: true, message: `User KYC ${action}ed` });
    } catch (error) {
        console.error("KYC Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
