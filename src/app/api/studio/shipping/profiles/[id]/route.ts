import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import ShippingProfile from "@/lib/db/models/ShippingProfile";

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

        // Prevent changing seller
        delete body.seller;

        // If setting as default, middleware will handle unsetting others
        const profile = await ShippingProfile.findOneAndUpdate(
            { _id: id, seller: session.user.id },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Shipping profile updated",
            profile
        });

    } catch (error: any) {
        console.error("Update Shipping Profile Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
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

        // Don't allow deleting default profile unless it's the only one? 
        // Or just let them delete it.
        const profile = await ShippingProfile.findOneAndDelete({
            _id: id,
            seller: session.user.id
        });

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Shipping profile deleted" });

    } catch (error) {
        console.error("Delete Shipping Profile Error:", error);
        return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
    }
}
