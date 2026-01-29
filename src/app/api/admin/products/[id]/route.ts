import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Basic RBAC check - Admin or Support can view
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_PRODUCTS)) {
            // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = await params;

        const product = await Product.findById(id).populate("seller", "name email");
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Fetch Product Error:", error);
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_PRODUCTS)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = await params;
        const body = await request.json();

        // Status Change Logic
        if (body.status) {
            // Approval / Unblock
            if (body.status === "active" || body.status === "published") {
                body.reviewedAt = new Date();
                // Set publishedAt if first time
                const product = await Product.findById(id);
                if (product && !product.publishedAt) {
                    body.publishedAt = new Date();
                }
            }
            // Block - no special handling needed, just update status
            else if (body.status === "blocked") {
                body.reviewedAt = new Date();
            }
            // Rejection
            else if (body.status === "rejected") {
                if (!body.rejectionReason) {
                    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
                }
                body.reviewedAt = new Date();
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).populate("seller", "name email");

        if (!updatedProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ product: updatedProduct });
    } catch (error) {
        console.error("Update Product Error:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_PRODUCTS)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = await params;

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete Product Error:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
