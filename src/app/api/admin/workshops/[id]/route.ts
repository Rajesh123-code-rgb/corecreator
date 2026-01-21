import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Workshop from "@/lib/db/models/Workshop";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Basic RBAC check
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_WORKSHOPS)) {
            // return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = params;

        const workshop = await Workshop.findById(id).populate("instructor", "name email");
        if (!workshop) {
            return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
        }

        return NextResponse.json({ workshop });
    } catch (error) {
        console.error("Fetch Workshop Error:", error);
        return NextResponse.json({ error: "Failed to fetch workshop" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_WORKSHOPS)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = params;

        const deletedWorkshop = await Workshop.findByIdAndDelete(id);

        if (!deletedWorkshop) {
            return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Workshop deleted successfully" });
    } catch (error) {
        console.error("Delete Workshop Error:", error);
        return NextResponse.json({ error: "Failed to delete workshop" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_WORKSHOPS)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const { id } = params;
        const body = await request.json();

        const workshop = await Workshop.findById(id);
        if (!workshop) {
            return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
        }

        // Handle approve/reject
        if (body.status === "upcoming" && workshop.status === "pending") {
            workshop.status = "upcoming";
            workshop.rejectionReason = undefined;
            workshop.reviewedAt = new Date();
        } else if (body.status === "rejected" && workshop.status === "pending") {
            workshop.status = "rejected";
            workshop.rejectionReason = body.rejectionReason;
            workshop.reviewedAt = new Date();
        } else {
            // Allow other status updates
            Object.assign(workshop, body);
        }

        await workshop.save();

        return NextResponse.json({
            message: "Workshop updated successfully",
            workshop: {
                id: workshop._id.toString(),
                status: workshop.status
            }
        });
    } catch (error) {
        console.error("Update Workshop Error:", error);
        return NextResponse.json({ error: "Failed to update workshop" }, { status: 500 });
    }
}
