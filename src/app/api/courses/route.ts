import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const skip = (page - 1) * limit;

        const category = searchParams.get("category");
        const level = searchParams.get("level");
        const sort = searchParams.get("sort") || "popular";
        const search = searchParams.get("search");
        const featured = searchParams.get("featured");
        const instructor = searchParams.get("instructor");
        const minRating = searchParams.get("minRating");

        const query: Record<string, unknown> = { status: "published" };

        if (category) query.category = category;
        if (level) query.level = level;
        if (featured === "true") query.isFeatured = true;
        if (instructor) query.instructor = instructor;
        if (minRating) query.rating = { $gte: parseFloat(minRating) };
        if (search) query.$text = { $search: search };

        let sortOption: Record<string, 1 | -1> = { enrollmentCount: -1 };
        switch (sort) {
            case "newest": sortOption = { createdAt: -1 }; break;
            case "price-low": sortOption = { price: 1 }; break;
            case "price-high": sortOption = { price: -1 }; break;
            case "rating": sortOption = { averageRating: -1 }; break;
            default: sortOption = { enrollmentCount: -1 };
        }

        const [courses, total] = await Promise.all([
            Course.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .select("title subtitle description price averageRating totalStudents thumbnail images slug category level createdAt")
                .populate("instructor", "name avatar bio")
                .lean(),
            Course.countDocuments(query),
        ]);

        return NextResponse.json({
            courses,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Courses API Error:", error);
        return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }
}
