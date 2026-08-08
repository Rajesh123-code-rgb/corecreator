// Server-only: queries MongoDB directly. Import from Server Components or
// route handlers - never from a "use client" file (use /api/courses there).
//
// Extracted verbatim from src/app/api/courses/route.ts so the same query can
// serve both the API route (for client-side re-fetching on filter change) and
// Server Components rendering the initial listing.
//
// The .select() list includes totalReviews/totalDuration/totalLectures, which
// the listing UI needs. They were previously omitted while the frontend also
// read them under the wrong names (reviewCount/duration/totalLessons), so the
// values silently rendered as undefined/NaN. Both halves are fixed together -
// keep the field names here in sync with the Course model, not with the UI.
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import Category from "@/lib/db/models/Category";

export interface CourseSearchFilters {
    page?: number;
    limit?: number;
    category?: string | null;
    level?: string | null;
    sort?: string | null;
    search?: string | null;
    featured?: string | null;
    instructor?: string | null;
    minRating?: string | null;
}

export interface CourseSearchResult {
    courses: Record<string, unknown>[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getCategoryFilterRegex(categoryParam: string) {
    if (!categoryParam || categoryParam === "all") return null;

    // Search for predefined category document
    const catDoc = await Category.findOne({
        type: "course",
        $or: [
            { slug: categoryParam.toLowerCase() },
            { name: { $regex: new RegExp(`^${escapeRegExp(categoryParam)}$`, "i") } }
        ]
    }).lean();

    const possibleValues = new Set<string>();
    possibleValues.add(categoryParam);
    possibleValues.add(categoryParam.replace(/-/g, " "));
    possibleValues.add(categoryParam.replace(/ /g, "-"));

    if (catDoc) {
        if (catDoc.name) possibleValues.add(catDoc.name);
        if (catDoc.slug) possibleValues.add(catDoc.slug);
    }

    // Build flexible patterns
    const patterns = Array.from(possibleValues).map(val =>
        `^${escapeRegExp(val).replace(/\\-/g, "[\\s\\-]")}s?$`
    );

    return new RegExp(patterns.join("|"), "i");
}

export async function getCourses(filters: CourseSearchFilters = {}): Promise<CourseSearchResult> {
    await connectDB();

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const categoryParam = filters.category;
    const level = filters.level;
    const sort = filters.sort || "popular";
    const search = filters.search;
    const featured = filters.featured;
    const instructor = filters.instructor;
    const minRating = filters.minRating;

    const query: Record<string, unknown> = { status: "published" };

    if (categoryParam && categoryParam !== "all") {
        const catRegex = await getCategoryFilterRegex(categoryParam);
        if (catRegex) {
            query.category = { $regex: catRegex };
        }
    }

    if (level && level !== "all") {
        query.level = { $regex: new RegExp(`^${escapeRegExp(level)}$`, "i") };
    }

    if (featured === "true") query.isFeatured = true;
    if (instructor) query.instructor = instructor;
    if (minRating) query.averageRating = { $gte: parseFloat(minRating) };
    if (search) query.$text = { $search: search };

    let sortOption: Record<string, 1 | -1> = { totalStudents: -1 };
    switch (sort) {
        case "newest": sortOption = { createdAt: -1 }; break;
        case "price-low": sortOption = { price: 1 }; break;
        case "price-high": sortOption = { price: -1 }; break;
        case "rating": sortOption = { averageRating: -1 }; break;
        default: sortOption = { totalStudents: -1 };
    }

    const [courses, total] = await Promise.all([
        Course.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .select("title subtitle description price averageRating totalReviews totalStudents totalDuration totalLectures thumbnail images slug category level createdAt")
            .populate("instructor", "name avatar bio")
            .lean(),
        Course.countDocuments(query),
    ]);

    return {
        courses: courses as unknown as Record<string, unknown>[],
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
