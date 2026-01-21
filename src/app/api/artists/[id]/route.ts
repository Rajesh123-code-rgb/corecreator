import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        // Find the user
        const user = await User.findById(id)
            .select("name avatar profile")
            .lean();

        if (!user) {
            return NextResponse.json({ error: "Artist not found" }, { status: 404 });
        }

        // Fetch their courses
        const courses = await Course.find({
            instructor: id,
            status: "published"
        })
            .select("title slug thumbnail price averageRating enrollmentCount level")
            .lean();

        // Fetch their products
        const products = await Product.find({
            seller: id,
            status: "active"
        })
            .select("name slug price images category")
            .lean();

        // Calculate total students
        const totalStudents = courses.reduce((sum, c: any) => sum + (c.enrollmentCount || 0), 0);

        // Calculate average rating
        const validRatings = courses.filter((c: any) => c.averageRating > 0);
        const avgRating = validRatings.length > 0
            ? validRatings.reduce((sum, c: any) => sum + c.averageRating, 0) / validRatings.length
            : 4.5;

        const userProfile = (user as any).profile || {};

        const artist = {
            id: (user as any)._id.toString(),
            name: (user as any).name || "Artist",
            avatar: (user as any).avatar || "https://randomuser.me/api/portraits/lego/1.jpg",
            bio: userProfile.bio || "Passionate artist and creator sharing knowledge with the community.",
            specialty: userProfile.specialty || "Artist & Creator",
            rating: Math.round(avgRating * 10) / 10,
            totalStudents,
            courses: courses.map((c: any) => ({
                ...c,
                _id: c._id.toString(),
                rating: c.averageRating || 0,
            })),
            products: products.map((p: any) => ({
                ...p,
                _id: p._id.toString(),
            })),
        };

        return NextResponse.json(artist);
    } catch (error) {
        console.error("Artist Profile API Error:", error);
        return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 });
    }
}
