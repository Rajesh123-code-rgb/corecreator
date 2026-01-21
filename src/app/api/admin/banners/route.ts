import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Banner from "@/lib/db/models/Banner";

// GET - Fetch all banners
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const placement = searchParams.get("placement");

        const query: Record<string, unknown> = {};
        if (placement) query.placement = placement;

        const banners = await Banner.find(query).sort({ placement: 1, order: 1, createdAt: -1 }).lean();

        // Group by placement
        const byPlacement: Record<string, typeof banners> = {};
        banners.forEach(banner => {
            if (!byPlacement[banner.placement]) byPlacement[banner.placement] = [];
            byPlacement[banner.placement].push(banner);
        });

        return NextResponse.json({
            banners: JSON.parse(JSON.stringify(banners)),
            byPlacement,
            total: banners.length,
        });
    } catch (error) {
        console.error("Failed to fetch banners:", error);
        return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
    }
}

// POST - Create new banner
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { title, subtitle, image, mobileImage, link, linkTarget, buttonText, placement, startDate, endDate, textColor, backgroundColor, order } = body;

        if (!title || !image || !placement) {
            return NextResponse.json({ error: "Title, image, and placement are required" }, { status: 400 });
        }

        const banner = await Banner.create({
            title,
            subtitle,
            image,
            mobileImage,
            link,
            linkTarget: linkTarget || "_self",
            buttonText,
            placement,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            textColor,
            backgroundColor,
            order: order || 0,
        });

        return NextResponse.json({
            success: true,
            banner: JSON.parse(JSON.stringify(banner)),
        });
    } catch (error) {
        console.error("Failed to create banner:", error);
        return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
    }
}

// PUT - Update banner
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Banner ID required" }, { status: 400 });
        }

        // Handle date conversions
        if (updates.startDate) updates.startDate = new Date(updates.startDate);
        if (updates.endDate) updates.endDate = new Date(updates.endDate);

        const banner = await Banner.findByIdAndUpdate(id, updates, { new: true });

        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            banner: JSON.parse(JSON.stringify(banner)),
        });
    } catch (error) {
        console.error("Failed to update banner:", error);
        return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
    }
}

// DELETE - Delete banner
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Banner ID required" }, { status: 400 });
        }

        await Banner.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Banner deleted" });
    } catch (error) {
        console.error("Failed to delete banner:", error);
        return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
    }
}
