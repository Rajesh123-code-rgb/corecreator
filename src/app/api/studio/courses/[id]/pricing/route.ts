import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { id } = await context.params;
        const data = await req.json();

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Update pricing
        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            {
                price: data.price,
                compareAtPrice: data.compareAtPrice,
                currency: data.currency,
            },
            { new: true, runValidators: true }
        );

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("Error updating pricing:", error);
        return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
    }
}
