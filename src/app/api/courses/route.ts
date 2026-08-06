import { NextRequest, NextResponse } from "next/server";
import { getCourses } from "@/lib/courseSearch";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const result = await getCourses({
            page: parseInt(searchParams.get("page") || "1"),
            limit: parseInt(searchParams.get("limit") || "12"),
            category: searchParams.get("category"),
            level: searchParams.get("level"),
            sort: searchParams.get("sort"),
            search: searchParams.get("search"),
            featured: searchParams.get("featured"),
            instructor: searchParams.get("instructor"),
            minRating: searchParams.get("minRating"),
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Courses API Error:", error);
        return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    }
}
