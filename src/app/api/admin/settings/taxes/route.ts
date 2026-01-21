import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import TaxRate from "@/lib/db/models/TaxRate";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const taxes = await TaxRate.find({}).sort({ country: 1, name: 1 });
        return NextResponse.json({ taxes });
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
        await connectDB();
        const body = await req.json();

        // Basic validation
        if (!body.name || body.rate === undefined || !body.country) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const tax = await TaxRate.create(body);
        return NextResponse.json({ success: true, tax });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: "Tax rate definition already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await connectDB();
        await TaxRate.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
