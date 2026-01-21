import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import mongoose from "mongoose";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const product = await Product.findOne({
            _id: id,
            seller: session.user.id
        }).lean();

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Get Product Error:", error);
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await request.json();

        // Security: Prevent updating seller field
        delete body.seller;
        delete body.sellerName;

        // Logic for handling status changes
        if (body.status === 'pending') {
            body.submittedAt = new Date();
            body.rejectionReason = undefined; // Clear previous rejection reason
        }

        const product = await Product.findOneAndUpdate(
            { _id: id, seller: session.user.id },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Product updated successfully",
            product
        });
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
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const product = await Product.findOneAndDelete({
            _id: id,
            seller: session.user.id
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete Product Error:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
