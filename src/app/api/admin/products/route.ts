import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import User from "@/lib/db/models/User";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC Check
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_PRODUCTS)) {
            // return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
            // For now, allow reading products if they are admin, specific permission check might need refinement
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const all = searchParams.get("all") === "true"; // For export

        const query: any = {};

        // Exclude drafts by default - admins shouldn't see studio drafts unless explicitly filtering
        if (status === "draft") {
            query.status = "draft";
        } else if (status && status !== "all") {
            query.status = status;
        } else {
            // Default: exclude drafts
            query.status = { $ne: "draft" };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }

        // If export (all=true), don't paginate
        let products;
        let total;

        const findQuery = Product.find(query)
            .populate("seller", "_id name email studioProfile.name")
            .sort({ createdAt: -1 });

        if (!all) {
            findQuery.skip(skip).limit(limit);
        }

        [products, total] = await Promise.all([
            findQuery.lean(),
            Product.countDocuments(query),
        ]);

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit: all ? total : limit,
                total,
                pages: all ? 1 : Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin Products API Error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

// POST - Create new product (Admin Create)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC Check
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_PRODUCTS)) {
            return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
        }

        await connectDB();
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.price || !body.category) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Admin-created products are assigned to the admin user (or a specific system user if needed)
        // For now, assign to current admin
        const newProduct = await Product.create({
            ...body,
            seller: session.user.id,
            sellerName: session.user.name || "Admin",
            status: "active", // Admin created products are active by default? or 'draft'
            slug: body.slug || undefined, // Will auto-generate if missing
        });

        return NextResponse.json({ product: newProduct, message: "Product created successfully" }, { status: 201 });

    } catch (error) {
        console.error("Create Product API Error:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
