import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Workshop from "@/lib/db/models/Workshop";

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

        const workshop = await Workshop.findOne({
            _id: id,
            instructor: session.user.id
        }).lean();

        if (!workshop) {
            return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
        }

        return NextResponse.json({
            workshop: {
                id: workshop._id.toString(),
                title: workshop.title,
                slug: workshop.slug,
                description: workshop.description,
                date: workshop.date,
                duration: workshop.duration,
                capacity: workshop.capacity,
                enrolledCount: workshop.enrolledCount || 0,
                price: workshop.price,
                currency: workshop.currency || "INR",
                thumbnail: workshop.thumbnail,
                workshopType: workshop.workshopType || "online",
                // Online fields
                meetingUrl: workshop.meetingUrl,
                meetingUserId: workshop.meetingUserId,
                meetingPassword: workshop.meetingPassword,
                // Offline fields
                location: workshop.location,
                requirements: workshop.requirements || [],
                agenda: workshop.agenda || [],
                category: workshop.category,
                tags: workshop.tags || [],
                level: workshop.level,
                status: workshop.status,
                rejectionReason: workshop.rejectionReason,
                createdAt: workshop.createdAt,
                updatedAt: workshop.updatedAt
            }
        });

    } catch (error) {
        console.error("Get Workshop Error:", error);
        return NextResponse.json({ error: "Failed to fetch workshop" }, { status: 500 });
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

        // Prevent updating protected fields
        delete body.instructor;
        delete body.instructorName;
        delete body.instructorAvatar;
        delete body.enrolledCount;
        delete body.attendees;

        // Convert date string to Date if provided
        if (body.date) {
            body.date = new Date(body.date);
        }

        const workshop = await Workshop.findOne({ _id: id, instructor: session.user.id });

        if (!workshop) {
            return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
        }

        // Handle status change
        if (body.status === "pending" && workshop.status !== "pending") {
            body.submittedAt = new Date();
            body.rejectionReason = undefined; // Clear any previous rejection
        }

        Object.assign(workshop, body);
        await workshop.save();

        return NextResponse.json({
            message: "Workshop updated successfully",
            workshop: {
                id: workshop._id.toString(),
                slug: workshop.slug,
                title: workshop.title,
                status: workshop.status
            }
        });

    } catch (error) {
        console.error("Update Workshop Error:", error);
        return NextResponse.json({ error: "Failed to update workshop" }, { status: 500 });
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

        const workshop = await Workshop.findOneAndDelete({
            _id: id,
            instructor: session.user.id
        });

        if (!workshop) {
            return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Workshop deleted successfully"
        });

    } catch (error) {
        console.error("Delete Workshop Error:", error);
        return NextResponse.json({ error: "Failed to delete workshop" }, { status: 500 });
    }
}
