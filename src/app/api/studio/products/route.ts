import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status"); // active, draft, archived
        const include = searchParams.get("include"); // inventory

        // Build query - filter by seller
        const query: Record<string, unknown> = { seller: userId };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        // Select fields based on include parameter
        const selectFields = include === "inventory"
            ? "name sku status price currency images quantity lowStockThreshold hasVariants variants createdAt updatedAt"
            : "name status salesCount price currency images slug createdAt updatedAt sku quantity";

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select(selectFields)
                .lean(),
            Product.countDocuments(query),
        ]);

        // Format products based on include parameter
        const formattedProducts = include === "inventory"
            ? products.map(product => ({
                _id: product._id.toString(),
                name: product.name || "Untitled Product",
                sku: product.sku || "",
                images: product.images || [],
                quantity: product.quantity || 0,
                lowStockThreshold: product.lowStockThreshold || 5,
                hasVariants: product.hasVariants || false,
                variants: product.variants?.map((v: any) => ({
                    id: v._id?.toString() || v.id,
                    attributes: v.attributes || [],
                    stock: v.stock || 0,
                    sku: v.sku || ""
                })) || [],
                price: product.price || 0,
                status: product.status || "draft"
            }))
            : products.map(product => ({
                id: product._id.toString(),
                title: product.name,
                status: product.status,
                sales: product.salesCount || 0,
                views: 0, // Views tracking not implemented yet
                price: product.price,
                currency: product.currency || "INR",
                thumbnail: product.images?.[0]?.url || product.images?.[0] || "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=100&h=60&fit=crop",
                slug: product.slug,
                sku: product.sku || "-",
                stock: product.quantity || 0,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            }));

        return NextResponse.json({
            products: formattedProducts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Studio Products API Error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // KYC Check
        const user = await ((await import("@/lib/db/models/User")).default).findById(session.user.id);
        if (!user || user.kyc?.status !== "approved") {
            return NextResponse.json({ error: "KYC verification required to list products" }, { status: 403 });
        }
        const body = await request.json();
        const userId = new mongoose.Types.ObjectId(session.user.id);
        const sellerName = session.user.name || "Unknown Seller";

        // Initial minimal validation for draft
        if (!body.name) {
            return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        }

        const newProduct = await Product.create({
            ...body,
            seller: userId,
            sellerName,
            status: body.status || "draft",
            price: body.price || 0,
            description: body.description || "Product description pending...",
            images: body.images || [],
            category: body.category || "Uncategorized"
        });

        return NextResponse.json({
            message: "Product created successfully",
            product: {
                id: newProduct._id.toString(),
                slug: newProduct.slug
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error("Create Product Error:", error);

        // Provide more specific error messages
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e: any) => e.message);
            return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
        }

        if (error.code === 11000) {
            return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
        }

        return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
    }
}
