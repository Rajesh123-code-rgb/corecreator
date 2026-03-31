import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import User from "@/lib/db/models/User";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";
import mongoose from "mongoose";

export interface BulkProductInput {
    name: string;
    description?: string;
    category: string;
    price: number;
    currency?: string;
    quantity?: number;
    sku?: string;
    tags?: string | string[];
    productType?: "physical" | "digital" | "service";
    sellerId?: string; // Optional: assign to a specific creator
}

export interface BulkUploadResult {
    index: number;
    name: string;
    success: boolean;
    productId?: string;
    error?: string;
}

/**
 * POST /api/admin/products/bulk-upload
 * Admin-only endpoint to create multiple products in one request.
 * Accepts: { products: BulkProductInput[], defaultSellerId?: string }
 * Returns: { created, failed, results[] }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_PRODUCTS)) {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        await connectDB();

        const body = await request.json();
        const products: BulkProductInput[] = body.products;
        const defaultSellerId: string | undefined = body.defaultSellerId;

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: "No products provided" }, { status: 400 });
        }

        if (products.length > 500) {
            return NextResponse.json({ error: "Maximum 500 products per batch" }, { status: 400 });
        }

        const results: BulkUploadResult[] = [];
        let created = 0;
        let failed = 0;

        for (let i = 0; i < products.length; i++) {
            const item = products[i];
            const name = item.name?.trim();
            const category = item.category?.trim();
            const price = parseFloat(String(item.price));

            // Validate required fields
            if (!name) {
                results.push({ index: i, name: item.name || `Row ${i + 1}`, success: false, error: "Product name is required" });
                failed++;
                continue;
            }
            if (!category) {
                results.push({ index: i, name, success: false, error: "Category is required" });
                failed++;
                continue;
            }
            if (isNaN(price) || price < 0) {
                results.push({ index: i, name, success: false, error: "Valid price is required" });
                failed++;
                continue;
            }

            // Resolve seller
            let sellerId: mongoose.Types.ObjectId;
            let sellerName = session.user.name || "Admin";

            if (item.sellerId || defaultSellerId) {
                const targetId = item.sellerId || defaultSellerId;
                try {
                    const seller = await User.findById(targetId).select("_id name").lean() as any;
                    if (!seller) {
                        results.push({ index: i, name, success: false, error: `Seller not found: ${targetId}` });
                        failed++;
                        continue;
                    }
                    sellerId = seller._id;
                    sellerName = seller.name;
                } catch {
                    results.push({ index: i, name, success: false, error: `Invalid seller ID: ${targetId}` });
                    failed++;
                    continue;
                }
            } else {
                sellerId = new mongoose.Types.ObjectId(session.user.id);
            }

            // Normalize tags
            let tags: string[] = [];
            if (Array.isArray(item.tags)) {
                tags = item.tags.map((t: string) => t.trim()).filter(Boolean);
            } else if (typeof item.tags === "string" && item.tags.trim()) {
                tags = item.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
            }

            try {
                const newProduct = await Product.create({
                    name,
                    description: item.description?.trim() || "Admin-uploaded product",
                    category,
                    price,
                    currency: item.currency || "INR",
                    quantity: parseInt(String(item.quantity ?? 0)) || 0,
                    sku: item.sku?.trim() || undefined,
                    tags,
                    productType: item.productType || "physical",
                    seller: sellerId,
                    sellerName,
                    status: "active", // Admin-uploaded products are active immediately
                    images: [],
                });

                results.push({ index: i, name, success: true, productId: newProduct._id.toString() });
                created++;
            } catch (err: any) {
                let errorMsg = "Failed to create product";
                if (err?.code === 11000) {
                    errorMsg = "Duplicate product (slug conflict) — try a unique name";
                } else if (err?.name === "ValidationError") {
                    errorMsg = Object.values(err.errors).map((e: any) => e.message).join(", ");
                } else if (err?.message) {
                    errorMsg = err.message;
                }
                results.push({ index: i, name, success: false, error: errorMsg });
                failed++;
            }
        }

        return NextResponse.json({
            created,
            failed,
            total: products.length,
            results,
        }, { status: 200 });

    } catch (error: any) {
        console.error("[Bulk Upload] Error:", error);
        return NextResponse.json({ error: "Bulk upload failed: " + (error.message || "Unknown error") }, { status: 500 });
    }
}
