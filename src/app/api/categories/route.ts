import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Category from "@/lib/db/models/Category";

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "product";

        const categories = await Category.find({
            type,
            isActive: true,
        })
            .sort({ order: 1, name: 1 })
            .select("name slug image description")
            .lean();

        return NextResponse.json({
            categories: JSON.parse(JSON.stringify(categories)),
        });
    } catch (error) {
        console.error("Failed to fetch public categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
