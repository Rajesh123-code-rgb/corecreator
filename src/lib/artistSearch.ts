import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";

// Extracted from src/app/api/artists/route.ts so the /artists page can render
// its list on the server instead of fetching it after hydration, mirroring
// src/lib/productSearch.ts and src/lib/courseSearch.ts.

export interface ArtistSummary {
    id: string;
    name: string;
    avatar: string;
    specialty: string;
    courses: number;
    products: number;
    /** null when the artist has no rated courses yet - never invent a score. */
    rating: number | null;
}

export interface ArtistFilters {
    limit?: number;
    sort?: string;
}

export async function getArtists({ limit = 8, sort = "courses" }: ArtistFilters = {}): Promise<ArtistSummary[]> {
    await connectDB();

    const users = await User.find({ role: "studio" })
        .select("name avatar profile")
        .limit(50)
        .lean();

    const artistData = await Promise.all(
        users.map(async (user) => {
            const [courseCount, productCount, coursesWithRating] = await Promise.all([
                Course.countDocuments({ instructor: user._id, status: "published" }),
                Product.countDocuments({ seller: user._id, status: "active" }),
                Course.find({ instructor: user._id, status: "published" })
                    .select("averageRating totalStudents")
                    .lean(),
            ]);

            // Average only over courses that actually carry a rating, so a
            // single rated course among several unrated ones is not dragged
            // toward zero.
            const rated = coursesWithRating.filter((c: any) => Number(c.averageRating) > 0);
            const avgRating = rated.length > 0
                ? rated.reduce((sum, c: any) => sum + Number(c.averageRating), 0) / rated.length
                : null;

            // Only include artists with at least one course or product
            if (courseCount === 0 && productCount === 0) {
                return null;
            }

            const userProfile = user.profile as any;
            return {
                id: user._id.toString(),
                name: user.name || "Artist",
                // Was a stock "lego" portrait from randomuser.me; fall back to
                // initials generated from the artist's own name instead.
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "Artist")}&background=random`,
                specialty: userProfile?.specialty || userProfile?.bio?.substring(0, 50) || "Artist & Creator",
                courses: courseCount,
                products: productCount,
                // Previously `|| 4.5`, which showed a 4.5-star score for artists
                // who had never been rated.
                rating: avgRating === null ? null : Math.round(avgRating * 10) / 10,
            };
        })
    );

    const filteredArtists = artistData.filter((a): a is ArtistSummary => a !== null);

    switch (sort) {
        case "rating":
            // Unrated artists sort last rather than counting as zero-star.
            filteredArtists.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
            break;
        case "products":
            filteredArtists.sort((a, b) => b.products - a.products);
            break;
        case "courses":
        default:
            filteredArtists.sort((a, b) => b.courses - a.courses);
    }

    return filteredArtists.slice(0, limit);
}
