import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import PromoCode from "@/lib/db/models/PromoCode";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { code, cartTotal, items } = await req.json();

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const promo = await PromoCode.findOne({
            code: code.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!promo) {
            return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 404 });
        }

        // Usage Limit Check
        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
        }

        // Calculate Discount
        let discountAmount = 0;

        if (promo.discountType === "percentage") {
            discountAmount = (cartTotal * promo.discountValue) / 100;
            if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
                discountAmount = promo.maxDiscount;
            }
        } else {
            discountAmount = promo.discountValue;
        }

        // Ensure discount doesn't exceed total
        if (discountAmount > cartTotal) {
            discountAmount = cartTotal;
        }

        return NextResponse.json({
            success: true,
            code: promo.code,
            discountAmount,
            discountType: promo.discountType,
            discountValue: promo.discountValue
        });

    } catch (error) {
        console.error("Promo validation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
