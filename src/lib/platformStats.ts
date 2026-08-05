// Server-only: queries MongoDB directly. Import only from Server Components
// or route handlers - never from a "use client" file (use /api/platform-stats
// + usePlatformStats() there instead).
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Course from "@/lib/db/models/Course";
import Product from "@/lib/db/models/Product";
import Payout from "@/lib/db/models/Payout";

export interface PlatformStats {
    products: number;
    courses: number;
    creators: number;
    learners: number;
    creatorEarnings: number;
}

/**
 * Real, DB-computed platform-wide stats for marketing surfaces
 * (homepage, /learn, /about). Used directly by Server Components,
 * and via /api/platform-stats by Client Components.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
    await connectDB();

    const [totalProducts, totalCourses, totalCreators, totalLearners, earningsResult] =
        await Promise.all([
            Product.countDocuments({ status: "active" }),
            Course.countDocuments({ status: "published" }),
            User.countDocuments({ role: "studio" }),
            User.countDocuments({ role: "user" }),
            Payout.aggregate([
                { $match: { status: "completed" } },
                { $group: { _id: null, total: { $sum: "$netEarnings" } } },
            ]),
        ]);

    return {
        products: totalProducts,
        courses: totalCourses,
        creators: totalCreators,
        learners: totalLearners,
        creatorEarnings: earningsResult[0]?.total || 0,
    };
}
