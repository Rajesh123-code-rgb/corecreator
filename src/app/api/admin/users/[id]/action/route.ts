import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> } // Explicitly type as Promise
) {
    const params = await props.params; // Await params first
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action } = await request.json();
        const { id } = params;

        if (!id || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        // RBAC Checks
        console.log("Admin Action Debug:", {
            user: session.user.email,
            role: session.user.role,
            adminRole: session.user.adminRole,
            permissions: session.user.permissions,
            action
        });

        const userPermissions = session.user.permissions || [];
        const isSuper = session.user.adminRole === "super";

        let hasPermission = false;

        switch (action) {
            case "ban":
            case "activate":
                hasPermission = isSuper || userPermissions.includes(PERMISSIONS.BAN_USERS) || userPermissions.includes(PERMISSIONS.MANAGE_USERS);
                break;
            case "verify":
            case "unverify":
                hasPermission = isSuper || userPermissions.includes(PERMISSIONS.VERIFY_USERS) || userPermissions.includes(PERMISSIONS.MANAGE_USERS);
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        if (!hasPermission) {
            return NextResponse.json({
                error: "Forbidden: Insufficient Permissions",
                debug: {
                    user: session.user.email,
                    role: session.user.role,
                    adminRole: session.user.adminRole,
                    permissions: session.user.permissions,
                    isSuper
                }
            }, { status: 403 });
        }

        // Perform Update
        let updateQuery = {};

        if (action === "ban") updateQuery = { isActive: false };
        if (action === "activate") updateQuery = { isActive: true };
        if (action === "verify") updateQuery = { isVerified: true };
        if (action === "unverify") updateQuery = { isVerified: false };

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateQuery,
            { new: true }
        ).select("name email role isActive isVerified");

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: `User ${action}d successfully`
        });

    } catch (error) {
        console.error("Admin User Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
