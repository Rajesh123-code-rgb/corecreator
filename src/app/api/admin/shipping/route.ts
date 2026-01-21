import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ShippingZone from "@/lib/db/models/ShippingZone";

// GET - Fetch all shipping zones
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const zones = await ShippingZone.find().sort({ isDefault: -1, name: 1 }).lean();

        return NextResponse.json({
            zones: JSON.parse(JSON.stringify(zones)),
            total: zones.length,
        });
    } catch (error) {
        console.error("Failed to fetch shipping zones:", error);
        return NextResponse.json({ error: "Failed to fetch shipping zones" }, { status: 500 });
    }
}

// POST - Create new shipping zone
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { name, countries, states, rates, isDefault } = body;

        if (!name) {
            return NextResponse.json({ error: "Zone name is required" }, { status: 400 });
        }

        const zone = await ShippingZone.create({
            name,
            countries: countries || [],
            states: states || [],
            rates: rates || [],
            isDefault: isDefault || false,
        });

        return NextResponse.json({
            success: true,
            zone: JSON.parse(JSON.stringify(zone)),
        });
    } catch (error) {
        console.error("Failed to create shipping zone:", error);
        return NextResponse.json({ error: "Failed to create shipping zone" }, { status: 500 });
    }
}

// PUT - Update shipping zone
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { id, name, countries, states, rates, isActive, isDefault } = body;

        if (!id) {
            return NextResponse.json({ error: "Zone ID required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (countries !== undefined) updateData.countries = countries;
        if (states !== undefined) updateData.states = states;
        if (rates !== undefined) updateData.rates = rates;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isDefault !== undefined) updateData.isDefault = isDefault;

        // Handle default zone logic
        if (isDefault === true) {
            await ShippingZone.updateMany({ _id: { $ne: id } }, { $set: { isDefault: false } });
        }

        const zone = await ShippingZone.findByIdAndUpdate(id, updateData, { new: true });

        if (!zone) {
            return NextResponse.json({ error: "Zone not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            zone: JSON.parse(JSON.stringify(zone)),
        });
    } catch (error) {
        console.error("Failed to update shipping zone:", error);
        return NextResponse.json({ error: "Failed to update shipping zone" }, { status: 500 });
    }
}

// DELETE - Delete shipping zone
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
            return NextResponse.json({ error: "Zone ID required" }, { status: 400 });
        }

        const zone = await ShippingZone.findById(id);
        if (zone?.isDefault) {
            return NextResponse.json({ error: "Cannot delete default zone" }, { status: 400 });
        }

        await ShippingZone.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Shipping zone deleted" });
    } catch (error) {
        console.error("Failed to delete shipping zone:", error);
        return NextResponse.json({ error: "Failed to delete shipping zone" }, { status: 500 });
    }
}
