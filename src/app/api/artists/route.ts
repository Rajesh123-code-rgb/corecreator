import { NextResponse } from "next/server";
import { getArtists } from "@/lib/artistSearch";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const artists = await getArtists({
            limit: parseInt(searchParams.get("limit") || "8"),
            sort: searchParams.get("sort") || "courses",
        });
        return NextResponse.json({ artists });
    } catch (error) {
        console.error("Artists API Error:", error);
        return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
    }
}
