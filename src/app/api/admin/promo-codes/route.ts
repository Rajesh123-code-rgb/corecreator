import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import PromoCode from "@/lib/db/models/PromoCode";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

// GET - List promo codes
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_MARKETING)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status");

        const query: any = {};

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } }
            ];
        }

        if (status && status !== "all") {
            const now = new Date();
            if (status === "active") {
                query.isActive = true;
                query.startDate = { $lte: now };
                query.endDate = { $gte: now };
            } else if (status === "paused") {
                query.isActive = false;
            } else if (status === "expired") {
                query.endDate = { $lt: now };
            }
        }

        const promoCodes = await PromoCode.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ promoCodes });
    } catch (error) {
        console.error("Fetch Promo Codes Error:", error);
        return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 });
    }
}

// POST - Create promo code
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_MARKETING)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const data = await req.json();

        // Basic validation
        if (!data.code || !data.name || !data.discountType || !data.discountValue || !data.startDate || !data.endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existingCode = await PromoCode.findOne({ code: data.code.toUpperCase() });
        if (existingCode) {
            return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
        }

        const promoCode = await PromoCode.create({
            ...data,
            code: data.code.toUpperCase(),
            createdBy: session.user.id
        });

        return NextResponse.json({ promoCode }, { status: 201 });
    } catch (error) {
        console.error("Create Promo Code Error:", error);
        return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
    }
}
