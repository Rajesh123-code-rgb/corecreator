import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status"); // published, draft, archived

        // Build query - filter by instructor
        const query: Record<string, unknown> = { instructor: userId };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const [courses, total] = await Promise.all([
            Course.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("title status totalStudents averageRating price thumbnail slug createdAt updatedAt totalLectures")
                .lean(),
            Course.countDocuments(query),
        ]);

        // Format courses for frontend
        const formattedCourses = courses.map(course => ({
            id: course._id.toString(),
            title: course.title,
            status: course.status,
            students: course.totalStudents || 0,
            rating: course.averageRating || 0,
            price: course.price,
            thumbnail: course.thumbnail || "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=100&h=60&fit=crop",
            slug: course.slug,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            lectures: course.totalLectures || 0
        }));

        return NextResponse.json({
            courses: formattedCourses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Studio Courses API Error:", error);
        return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }
}
