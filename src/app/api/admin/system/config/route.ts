import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import SystemConfig from "@/lib/db/models/SystemConfig";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const configs = await SystemConfig.find({});
        return NextResponse.json({ configs });
    } catch (error) {
        console.error("Failed to fetch system config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    // Strict check: Only Super Admin or specific Operations role should change system flags
    // For now, checking 'admin' role
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const { key, value } = await req.json();

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 });
        }

        const config = await SystemConfig.findOneAndUpdate(
            { key },
            {
                value,
                updatedBy: session.user.email,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error("Failed to update system config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
