import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import PromoCode from "@/lib/db/models/PromoCode";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

// PUT - Update promo code
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_MARKETING)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await connectDB();
        const data = await req.json();

        const promoCode = await PromoCode.findByIdAndUpdate(id, { ...data, code: data.code.toUpperCase() }, { new: true });

        if (!promoCode) return NextResponse.json({ error: "Promo code not found" }, { status: 404 });

        return NextResponse.json({ promoCode });
    } catch (error) {
        console.error("Update Promo Code Error:", error);
        return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
    }
}

// DELETE - Remove promo code
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_MARKETING)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await connectDB();

        const promoCode = await PromoCode.findByIdAndDelete(id);
        if (!promoCode) return NextResponse.json({ error: "Promo code not found" }, { status: 404 });

        return NextResponse.json({ message: "Promo code deleted" });
    } catch (error) {
        console.error("Delete Promo Code Error:", error);
        return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
    }
}

// PATCH - Toggle status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_MARKETING)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await connectDB();
        const { isActive } = await req.json();

        const promoCode = await PromoCode.findByIdAndUpdate(id, { isActive }, { new: true });
        if (!promoCode) return NextResponse.json({ error: "Promo code not found" }, { status: 404 });

        return NextResponse.json({ promoCode });
    } catch (error) {
        console.error("Toggle Status Error:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
