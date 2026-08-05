import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/platformStats";

// Public, site-wide platform stats for marketing surfaces (homepage, /learn, /about).
// Cached for 5 minutes so these pages don't hit the DB on every request.
export const revalidate = 300;

export async function GET() {
    try {
        const stats = await getPlatformStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error("Failed to fetch platform stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch platform stats" },
            { status: 500 }
        );
    }
}
