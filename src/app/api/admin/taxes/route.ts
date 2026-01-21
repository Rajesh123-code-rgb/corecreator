import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import TaxRate from "@/lib/db/models/TaxRate";

// GET - Fetch all tax rates
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const country = searchParams.get("country");

        const query: Record<string, unknown> = {};
        if (country) query.country = country;

        const taxes = await TaxRate.find(query).sort({ country: 1, priority: 1, name: 1 }).lean();

        // Group by country
        const byCountry: Record<string, typeof taxes> = {};
        taxes.forEach(tax => {
            if (!byCountry[tax.country]) byCountry[tax.country] = [];
            byCountry[tax.country].push(tax);
        });

        return NextResponse.json({
            taxes: JSON.parse(JSON.stringify(taxes)),
            byCountry,
            total: taxes.length,
        });
    } catch (error) {
        console.error("Failed to fetch tax rates:", error);
        return NextResponse.json({ error: "Failed to fetch tax rates" }, { status: 500 });
    }
}

// POST - Create new tax rate
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { name, rate, country, state, applyTo, isCompound, displayName, isInclusive, priority } = body;

        if (!name || rate === undefined || !country) {
            return NextResponse.json({ error: "Name, rate, and country are required" }, { status: 400 });
        }

        const tax = await TaxRate.create({
            name,
            rate,
            country,
            region: state, // Map state to region
            applyTo: applyTo || "all",
            isCompound: isCompound || false,
            displayName,
            isInclusive: isInclusive || false,
            priority: priority || 0,
        });

        return NextResponse.json({
            success: true,
            tax: JSON.parse(JSON.stringify(tax)),
        });
    } catch (error) {
        console.error("Failed to create tax rate:", error);
        return NextResponse.json({ error: "Failed to create tax rate" }, { status: 500 });
    }
}

// PUT - Update tax rate
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { id, name, rate, country, state, applyTo, isCompound, displayName, isInclusive, isActive, priority } = body;

        if (!id) {
            return NextResponse.json({ error: "Tax rate ID required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (rate !== undefined) updateData.rate = rate;
        if (country !== undefined) updateData.country = country;
        if (state !== undefined) updateData.region = state; // Map state to region
        if (applyTo !== undefined) updateData.applyTo = applyTo;
        if (isCompound !== undefined) updateData.isCompound = isCompound;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (isInclusive !== undefined) updateData.isInclusive = isInclusive;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (priority !== undefined) updateData.priority = priority;

        const tax = await TaxRate.findByIdAndUpdate(id, updateData, { new: true });

        if (!tax) {
            return NextResponse.json({ error: "Tax rate not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            tax: JSON.parse(JSON.stringify(tax)),
        });
    } catch (error) {
        console.error("Failed to update tax rate:", error);
        return NextResponse.json({ error: "Failed to update tax rate" }, { status: 500 });
    }
}

// DELETE - Delete tax rate
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
            return NextResponse.json({ error: "Tax rate ID required" }, { status: 400 });
        }

        await TaxRate.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Tax rate deleted" });
    } catch (error) {
        console.error("Failed to delete tax rate:", error);
        return NextResponse.json({ error: "Failed to delete tax rate" }, { status: 500 });
    }
}
