import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import Course from "@/lib/db/models/Course";
import Progress from "@/lib/db/models/Progress";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const userId = new mongoose.Types.ObjectId(session.user.id);

        // 1. Find all paid orders for this user
        const orders = await Order.find({
            user: userId,
            status: "paid",
        }).lean();

        // 2. Extract course IDs from orders
        const courseIds = new Set<string>();
        for (const order of orders) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of order.items as any[]) {
                if (item.itemType === "course") {
                    courseIds.add(item.itemId.toString());
                }
            }
        }

        if (courseIds.size === 0) {
            return NextResponse.json({ courses: [] });
        }

        // 3. Fetch course details
        const courses = await Course.find({
            _id: { $in: Array.from(courseIds) }
        })
            .select("title slug thumbnail instructor instructorName totalLectures")
            .populate("instructor", "name")
            .lean();

        // 4. Fetch progress for each course
        // Progress model stores lesson-level progress. We need to aggregate.
        // Or maybe just fetch all progress docs for this user and these courses?
        const progressDocs = await Progress.find({
            userId: userId,
            courseId: { $in: Array.from(courseIds) }
        }).lean();

        // 5. Combine data
        const enrolledCourses = courses.map(course => {
            const courseProgressDocs = progressDocs.filter(p => p.courseId.toString() === course._id.toString());
            const completedLessons = courseProgressDocs.filter(p => p.completed).length; // Assuming 'completed' field exists or we calculate it?
            // Progress model schema:
            // userId, courseId, lessonId, watchTime, duration, completed: boolean (Wait, I need to check Schema)

            // Let's check Progress model schema in next step if unsure.
            // Assuming 'completed' field exists or check watchTime >= duration * 0.9

            // To be safe, I'll check schema. I viewed it earlier in step 153.
            // "completed: { type: Boolean, default: false }"
            // Yes, it exists.

            const totalLessons = course.totalLectures || courseProgressDocs.length || 0; // totalLessons logic might be tricky if not in Course model properly.
            // Course model has virtual 'totalLessons' but .lean() doesn't include virtuals unless specified?
            // Actually, in `Course.ts` (step 152), totalLessons is defined in schema? 
            // "totalLessons: { type: Number, default: 0 }" - Yes, it's in schema.

            const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return {
                id: course._id,
                title: course.title,
                slug: course.slug,
                thumbnail: course.thumbnail,
                instructor: (course.instructor as any)?.name || course.instructorName,
                totalLessons,
                completedLessons,
                progress: progressPercent,
            };
        });

        return NextResponse.json({ courses: enrolledCourses });

    } catch (error) {
        console.error("Get enrolled courses error:", error);
        return NextResponse.json({ error: "Failed to fetch enrolled courses" }, { status: 500 });
    }
}
