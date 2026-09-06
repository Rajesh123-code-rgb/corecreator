import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Category from "@/lib/db/models/Category";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

/**
 * Builds the slug for a category.
 *
 * `slug` carries a unique index across the whole collection rather than one
 * scoped per type, so a product and a course category cannot share a slug. The
 * rows already in the database work around that by suffixing the type on
 * everything except products - "kintsugi" and "kintsugi-course" - and this
 * keeps new and renamed rows to the same rule.
 *
 * Both handlers previously derived the slug from the name alone. That was
 * harmless while product and course names barely overlapped; now that all 48
 * art forms exist under both types it means an admin could neither create a
 * course category named after an existing product one - the duplicate check
 * rejected it - nor rename an existing one, because regenerating the slug
 * dropped the suffix and collided on the unique index.
 */
function buildSlug(name: string, type: string): string {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    return type === "product" ? base : `${base}-${type}`;
}

// GET - Fetch all categories
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_CATEGORIES)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "all";
        const includeInactive = searchParams.get("includeInactive") === "true";

        const query: Record<string, unknown> = {};
        if (type !== "all") query.type = type;
        if (!includeInactive) query.isActive = true;

        const categories = await Category.find(query)
            .sort({ type: 1, order: 1, name: 1 })
            .populate("parent", "name slug")
            .lean();

        // Get counts by type
        const [productCount, courseCount, workshopCount] = await Promise.all([
            Category.countDocuments({ type: "product" }),
            Category.countDocuments({ type: "course" }),
            Category.countDocuments({ type: "workshop" }),
        ]);

        return NextResponse.json({
            categories: JSON.parse(JSON.stringify(categories)),
            stats: {
                product: productCount,
                course: courseCount,
                workshop: workshopCount,
                total: productCount + courseCount + workshopCount,
            },
        });
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST - Create new category
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_CATEGORIES)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { name, type, description, image, icon, parent, order } = body;

        if (!name || !type) {
            return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
        }

        const slug = buildSlug(name, type);

        const existing = await Category.findOne({ slug });
        if (existing) {
            return NextResponse.json(
                { error: `A ${type} category named "${name}" already exists` },
                { status: 400 }
            );
        }

        const category = await Category.create({
            name,
            slug,
            type,
            description,
            image,
            icon,
            parent: parent || undefined,
            order: order || 0,
        });

        return NextResponse.json({
            success: true,
            category: JSON.parse(JSON.stringify(category)),
        });
    } catch (error) {
        console.error("Failed to create category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_CATEGORIES)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { id, name, description, image, icon, parent, order, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: "Category ID required" }, { status: 400 });
        }

        const current = await Category.findById(id).select("type").lean();
        if (!current) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};
        if (name !== undefined) {
            updateData.name = name;
            // Derived from this row's own type, not from the name alone -
            // otherwise renaming a course category strips its "-course" suffix
            // and collides with the product category of the same name.
            updateData.slug = buildSlug(name, (current as { type: string }).type);
        }
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (icon !== undefined) updateData.icon = icon;
        if (parent !== undefined) updateData.parent = parent || null;
        if (order !== undefined) updateData.order = order;
        if (isActive !== undefined) updateData.isActive = isActive;

        const category = await Category.findByIdAndUpdate(id, updateData, { new: true });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            category: JSON.parse(JSON.stringify(category)),
        });
    } catch (error) {
        // A unique-index clash on slug is a name the admin can fix, not a
        // server fault. Saying so beats a generic 500.
        if ((error as { code?: number }).code === 11000) {
            return NextResponse.json(
                { error: "Another category of this type already uses that name" },
                { status: 409 }
            );
        }
        console.error("Failed to update category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_CATEGORIES)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Category ID required" }, { status: 400 });
        }

        // Check if category has children
        const hasChildren = await Category.countDocuments({ parent: id });
        if (hasChildren > 0) {
            return NextResponse.json({ error: "Cannot delete category with subcategories" }, { status: 400 });
        }

        await Category.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Category deleted" });
    } catch (error) {
        console.error("Failed to delete category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
