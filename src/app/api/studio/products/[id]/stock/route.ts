import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/studio/products/[id]/stock - Update stock levels
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { variantId, stock } = body;

        if (typeof stock !== "number" || stock < 0) {
            return NextResponse.json({ error: "Invalid stock value" }, { status: 400 });
        }

        await connectDB();

        // Find the product and verify ownership
        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check ownership
        if (product.seller.toString() !== session.user.id) {
            return NextResponse.json({ error: "Not authorized to update this product" }, { status: 403 });
        }

        if (variantId) {
            // Update specific variant stock
            const variantIndex = product.variants.findIndex((v: any) => v.id === variantId);
            if (variantIndex === -1) {
                return NextResponse.json({ error: "Variant not found" }, { status: 404 });
            }

            product.variants[variantIndex].stock = stock;
            await product.save();

            return NextResponse.json({
                success: true,
                message: "Variant stock updated",
                variant: product.variants[variantIndex]
            });
        } else {
            // Update base product quantity
            product.quantity = stock;
            await product.save();

            return NextResponse.json({
                success: true,
                message: "Product stock updated",
                quantity: product.quantity
            });
        }
    } catch (error: any) {
        console.error("Stock update error:", error);
        return NextResponse.json(
            { error: "Failed to update stock", details: error.message },
            { status: 500 }
        );
    }
}
