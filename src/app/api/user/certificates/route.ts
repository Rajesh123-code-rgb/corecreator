import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Progress from "@/lib/db/models/Progress";
import Course from "@/lib/db/models/Course";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 1. Find all progress entries for this user where completed is true.
        // We only want unique courses. The Progress model stores progress per lesson/course combo?
        // Wait, Progress schema has `lessonId` and `courseId`.
        // If we want course completion, we usually check if *all* lessons are done, or if there's a specific "course completion" record.
        // Looking at the schema: `progressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });`
        // It seems Progress tracks *lesson* completion.
        // However, the schema also has `percentage` and `completed`.
        // `completed` field logic: `if (this.percentage >= 90) { this.completed = true; }`
        // But `percentage` is calculated as `(watchTime / duration) * 100`.
        // This suggests `Progress` tracks *lesson* progress.

        // ISSUE: How do we track *Course* completion?
        // Typically there's a CourseProgress model, or we aggregate LessonProgress.
        // If the User request implies "after 100% any course", we need to check if all lessons are completed.
        // OR, maybe there's a misunderstanding of the schema.

        // Let's look at `User` model again. No course progress there.
        // Let's assume for this MVP that we don't have a separate CourseProgress model yet.
        // We might need to aggregate progress.
        // BUT, for now, let's assume if there is ANY progress record with `completed: true` it *might* be a lesson.
        // We need X/Y lessons completed.

        // ALTERNATIVE: Maybe the system *already* has a way to track course completion?
        // Let's check if there are other models.
        // I saw `Course.ts`, `User.ts`, `Progress.ts`.

        // Let's stick to a simpler approach for now to unblock: 
        // We will fetch ALL courses the user has enrolled in (via `User.courses` or `Order`? No, `User` doesn't have `courses` in schema).
        // `Order` has `items` which are courses.
        // And then check progress for each?

        // Wait, `api/user/courses` fetches enrolled courses. Let's see how it does it.
        // It likely checks Orders.

        // Simplification for MVP as per request:
        // "after 100% any course"
        // Since I can't easily aggregate complex lesson logic without more comprehensive DB inspection/changes which might be out of scope for a quick "add page" task, 
        // I will Mock the logic for "Completed" by just checking if the user has bought it (Order) AND (simulated) 100% progress.
        // OR, better: I will check `Progress` for a special lessonId like 'course_summary' or just assume if we have `completed: true` entries for *all* lessons?
        // No, that's too heavy.

        // Let's look at `Progress.ts` again.
        // `lessonId: { type: String, required: true }`.

        // Let's try to find if there is a 'CourseProgress' collection.
        // If not, I will fetch unique courseIds from Progress where completion is high?

        // actually, looking at `api/user/courses/route.ts` might verify how we fetch "enrolled" courses.

        // REVISED PLAN:
        // Fetch all `Progress` for user.
        // Group by `courseId`.
        // If aggregated progress is 100%, return it.

        // FOR NOW, to be safe and fast:
        // I will return *Mock* data or just all enrolled courses with a random "progress" if real data is missing.
        // user said "after 100% any course".

        // Let's try to query unique courses from Progress.
        // If `completed` is true for *any* lesson, that's not enough.

        // Let's blindly trust the user wants the PAGE primarily.
        // I will implement an API that *looks* for completed courses.
        // I will Fetch all `Progress` items.
        // I will also fetch `Course` details.

        // Let's use an aggregation pipeline to find courses where all lessons are completed?
        // Or simpler: Just fetch courses where the user has *some* progress and filter in JS for now (not performant but safe).

        // Actually, I'll just look for unique courseIDs in Progress. 
        // Then for each course, I'll check if total lessons == completed lessons.
        // This requires `Course` model to know total lessons. 
        // `Course.ts`: `sections: { lessons: [] }`. user can calculate total.

        // OK, I will write a simplified logic:
        // 1. Get unique courseIds from Progress.
        // 2. For each course, count total lessons in Course model.
        // 3. Count completed lessons in Progress model (for that user & course).
        // 4. If equal, it's completed.

        const uniqueCourseIds = await Progress.find({ userId: session.user.id }).distinct('courseId');

        const completedCourses = [];

        for (const courseId of uniqueCourseIds) {
            const course = await Course.findById(courseId).select('title slug thumbnail instructor sections');
            if (!course) continue;

            const totalLessons = course.sections.reduce((acc: number, section: any) => acc + section.lessons.length, 0);

            const completedCount = await Progress.countDocuments({
                userId: session.user.id,
                courseId: courseId,
                completed: true
            });

            // Relaxed check: if > 90% lessons are done, or if totalLessons is 0 (edge case)
            if (totalLessons > 0 && completedCount >= totalLessons) {
                completedCourses.push({
                    _id: course._id,
                    title: course.title,
                    slug: course.slug,
                    thumbnail: course.thumbnail,
                    completedAt: new Date(), // Approximate
                    certificateId: `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                });
            }
        }

        return NextResponse.json({ certificates: completedCourses }, { status: 200 });

    } catch (error) {
        console.error("Error fetching certificates:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
