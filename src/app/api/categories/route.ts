import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Category from "@/lib/db/models/Category";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import Workshop from "@/lib/db/models/Workshop";

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "product";

        // 1. Fetch predefined categories
        const definedCategories = await Category.find({
            type,
            isActive: true,
        })
            .sort({ order: 1, name: 1 })
            .select("_id name slug image description")
            .lean();

        // Track existing names and slugs (case-insensitive)
        const existingSlugs = new Set<string>();
        const existingNames = new Set<string>();

        definedCategories.forEach((cat: any) => {
            if (cat.slug) existingSlugs.add(cat.slug.toLowerCase());
            if (cat.name) existingNames.add(cat.name.toLowerCase());
        });

        // 2. Fetch distinct categories from active data items
        let distinctCategoryStrings: string[] = [];
        if (type === "product") {
            distinctCategoryStrings = await Product.distinct("category", { status: "active" });
        } else if (type === "course") {
            distinctCategoryStrings = await Course.distinct("category", { status: "published" });
        } else if (type === "workshop") {
            distinctCategoryStrings = await Workshop.distinct("category");
        }

        // 3. Merge distinct categories into result
        const extraCategories: any[] = [];
        distinctCategoryStrings.forEach((catName) => {
            if (!catName || typeof catName !== "string") return;
            const trimmedName = catName.trim();
            if (!trimmedName) return;

            const catSlug = slugify(trimmedName);
            if (!existingNames.has(trimmedName.toLowerCase()) && !existingSlugs.has(catSlug)) {
                existingNames.add(trimmedName.toLowerCase());
                existingSlugs.add(catSlug);
                extraCategories.push({
                    _id: `dynamic-${catSlug}`,
                    name: trimmedName,
                    slug: catSlug,
                });
            }
        });

        const allCategories = [...definedCategories, ...extraCategories];

        return NextResponse.json({
            categories: JSON.parse(JSON.stringify(allCategories)),
        });
    } catch (error) {
        console.error("Failed to fetch public categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}
