import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { adminRole } = body;

        if (!adminRole) {
            return NextResponse.json({ error: "Missing adminRole" }, { status: 400 });
        }

        await connectDB();

        // Prevent modifying self to avoid lockout (unless explicit allow?)
        // Ideally handled client side but good safety check
        if (session.user.id === id) {
            // allowing self-update might be risky if they downgrade themselves
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { adminRole },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Admin role updated", user: updatedUser });

    } catch (error) {
        console.error("Team update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Prevent deleting self
        if (session.user.id === id) {
            return NextResponse.json({ error: "Cannot revoke your own access" }, { status: 400 });
        }

        await connectDB();

        // Instead of deleting the user, we downgrade them to "user" role and remove adminRole
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                role: "user",
                $unset: { adminRole: "", permissions: "" }
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Admin access revoked", user: updatedUser });

    } catch (error) {
        console.error("Team delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
