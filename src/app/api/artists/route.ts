import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "8");
        const sort = searchParams.get("sort") || "courses"; // courses, products, rating

        // Find users with 'studio' role who have created content
        const users = await User.find({ role: "studio" })
            .select("name avatar profile")
            .limit(50)
            .lean();

        // Get course and product counts for each user
        const artistData = await Promise.all(
            users.map(async (user) => {
                const [courseCount, productCount, coursesWithRating] = await Promise.all([
                    Course.countDocuments({ instructor: user._id, status: "published" }),
                    Product.countDocuments({ seller: user._id, status: "active" }),
                    Course.find({ instructor: user._id, status: "published" })
                        .select("averageRating enrollmentCount")
                        .lean(),
                ]);

                // Calculate average rating
                const totalRatings = coursesWithRating.reduce((sum, c: any) => sum + (c.averageRating || 0), 0);
                const avgRating = coursesWithRating.length > 0
                    ? totalRatings / coursesWithRating.length
                    : 0;

                // Only include artists with at least one course or product
                if (courseCount === 0 && productCount === 0) {
                    return null;
                }

                const userProfile = user.profile as any;
                return {
                    id: user._id.toString(),
                    name: user.name || "Artist",
                    avatar: user.avatar || "https://randomuser.me/api/portraits/lego/1.jpg",
                    specialty: userProfile?.specialty || userProfile?.bio?.substring(0, 50) || "Artist & Creator",
                    courses: courseCount,
                    products: productCount,
                    rating: Math.round(avgRating * 10) / 10 || 4.5,
                };
            })
        );

        // Filter out null entries and sort
        let filteredArtists = artistData.filter(a => a !== null);

        switch (sort) {
            case "rating":
                filteredArtists.sort((a, b) => (b?.rating || 0) - (a?.rating || 0));
                break;
            case "products":
                filteredArtists.sort((a, b) => (b?.products || 0) - (a?.products || 0));
                break;
            case "courses":
            default:
                filteredArtists.sort((a, b) => (b?.courses || 0) - (a?.courses || 0));
        }

        // Apply limit
        filteredArtists = filteredArtists.slice(0, limit);

        return NextResponse.json({ artists: filteredArtists });
    } catch (error) {
        console.error("Artists API Error:", error);
        return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
    }
}
