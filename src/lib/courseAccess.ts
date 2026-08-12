import mongoose from "mongoose";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";

/**
 * Whether a user has bought a course.
 *
 * Ownership is derived from paid orders - there is no enrolment table - so this
 * is the single place that decision gets made. Note `paymentStatus`, not
 * `status`: the latter tracks fulfilment (pending -> confirmed -> shipped ->
 * delivered) and can never hold "paid". Querying the wrong one is what left
 * paying customers looking at an empty course library.
 */
export async function hasPurchasedCourse(
    userId: string | undefined | null,
    courseId: string
): Promise<boolean> {
    if (!userId) return false;

    try {
        await connectDB();
        const order = await Order.findOne({
            user: new mongoose.Types.ObjectId(userId),
            paymentStatus: "paid",
            items: {
                $elemMatch: {
                    itemType: "course",
                    itemId: new mongoose.Types.ObjectId(courseId),
                },
            },
        })
            .select("_id")
            .lean();
        return Boolean(order);
    } catch (error) {
        // Fail closed: an error here must not hand out paid content.
        console.error("Course access check failed:", error);
        return false;
    }
}

/**
 * Removes paid lesson content from a course document for viewers who have not
 * bought it, leaving the curriculum outline visible so the sales page still
 * shows what is included.
 *
 * Lessons marked isFree keep their media - those are the preview lessons.
 */
export function stripPaidLessonContent<T extends Record<string, any>>(course: T): T {
    const sections = (course as any).sections;
    if (!Array.isArray(sections)) return course;

    return {
        ...course,
        sections: sections.map((section: any) => ({
            ...section,
            lessons: (section?.lessons || []).map((lesson: any) => {
                if (lesson?.isFree) return lesson;
                const { content, ...rest } = lesson || {};
                return {
                    ...rest,
                    // Keep the shape the UI expects, minus anything playable or
                    // downloadable. Duration stays so the outline still reads
                    // correctly.
                    content: {
                        videoDuration: content?.videoDuration ?? 0,
                    },
                    isLocked: true,
                };
            }),
        })),
    } as T;
}
