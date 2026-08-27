import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";

/**
 * Loads a course and confirms the caller is allowed to work on it.
 *
 * Both handlers previously trusted the id alone. GET had no session check at
 * all, so anyone who could guess an id could read any course document,
 * unpublished drafts included. PATCH checked only that *someone* was signed in,
 * never that they owned the course - so any account at all, including an
 * ordinary buyer, could edit or unpublish any creator's course.
 */
async function loadOwnedCourse(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    await connectDB();
    const course = await Course.findById(id);
    if (!course) {
        return { error: NextResponse.json({ error: "Course not found" }, { status: 404 }) };
    }

    const isOwner = course.instructor?.toString() === session.user.id;
    const isAdmin = (session.user as { role?: string }).role === "admin";
    if (!isOwner && !isAdmin) {
        // 404 rather than 403: confirming the id exists tells an unauthorised
        // caller something they should not learn from this endpoint.
        return { error: NextResponse.json({ error: "Course not found" }, { status: 404 }) };
    }

    return { course };
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { course, error } = await loadOwnedCourse(id);
        if (error) return error;

        return NextResponse.json(course!.toObject());
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
    }
}

/** Fields a creator may change, and how each is normalised. */
const EDITABLE: Record<string, (value: unknown) => unknown> = {
    title: (v) => v,
    subtitle: (v) => v,
    description: (v) => v,
    category: (v) => v,
    currency: (v) => v,
    thumbnail: (v) => v,
    promoVideo: (v) => v,
    level: (v) => (typeof v === "string" ? v.toLowerCase() : v),
    learningOutcomes: (v) => (Array.isArray(v) ? v.filter((o: string) => o?.trim() !== "") : []),
    targetAudience: (v) => (Array.isArray(v) ? v.filter((a: string) => a?.trim() !== "") : []),
    prerequisites: (v) => (Array.isArray(v) ? v.filter((p: string) => p?.trim() !== "") : []),
};

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { course, error } = await loadOwnedCourse(id);
        if (error) return error;

        const data = await req.json();

        // Only touch what the request actually sent.
        //
        // This handler used to assign every field unconditionally:
        //
        //     course.category  = data.category;    // undefined when absent
        //     course.thumbnail = data.thumbnail;   // undefined when absent
        //
        // which made a PATCH behave like a full replace. "Submit for Review"
        // sends { status: "pending" } and nothing else, so every other field was
        // set to undefined and save() failed validation on category and
        // thumbnail - the 500 behind "Failed to update course". Submitting a
        // course for approval could therefore never succeed. Worse, the fields
        // without a `required` rule were not protected by that failure at all,
        // so a partial write that did pass validation would have quietly erased
        // them.
        for (const [key, normalise] of Object.entries(EDITABLE)) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                (course as unknown as Record<string, unknown>)[key] = normalise(data[key]);
            }
        }

        if (Object.prototype.hasOwnProperty.call(data, "price")) {
            const price = parseFloat(data.price);
            if (!Number.isFinite(price) || price < 0) {
                return NextResponse.json({ error: "Price must be a number" }, { status: 400 });
            }
            course!.price = price;
        }

        if (data.status) {
            if (data.status === "pending" && course!.status !== "pending") {
                course!.status = "pending";
                course!.submittedAt = new Date();
                course!.rejectionReason = undefined;
            } else if (data.status !== course!.status) {
                course!.status = data.status;
            }
        }

        await course!.save();
        return NextResponse.json(course!.toObject());
    } catch (error) {
        // Say which fields are wrong. A bare "Failed to update course" toast
        // gives the creator nothing to act on and hides the cause from us too.
        if (error instanceof Error && error.name === "ValidationError") {
            const fields = Object.keys((error as unknown as { errors: Record<string, unknown> }).errors || {});
            return NextResponse.json(
                {
                    error: fields.length
                        ? `Please complete: ${fields.join(", ")}`
                        : "Course details are incomplete",
                    fields,
                },
                { status: 400 }
            );
        }
        console.error("Error updating course:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}
