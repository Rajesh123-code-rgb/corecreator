import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ShippingProfile from "@/lib/db/models/ShippingProfile";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const profiles = await ShippingProfile.find({ seller: session.user.id })
            .sort({ isDefault: -1, createdAt: -1 });

        return NextResponse.json({ profiles });
    } catch (error) {
        console.error("Get Shipping Profiles Error:", error);
        return NextResponse.json({ error: "Failed to fetch shipping profiles" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
        }

        // Check if first profile, make default if so
        const count = await ShippingProfile.countDocuments({ seller: session.user.id });
        const isDefault = count === 0 ? true : (body.isDefault || false);

        const profile = await ShippingProfile.create({
            ...body,
            seller: session.user.id,
            isDefault
        });

        return NextResponse.json({
            message: "Shipping profile created",
            profile
        }, { status: 201 });

    } catch (error: any) {
        console.error("Create Shipping Profile Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create profile" }, { status: 500 });
    }
}
