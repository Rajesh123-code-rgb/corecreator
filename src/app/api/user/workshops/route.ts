
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Workshop from "@/lib/db/models/Workshop";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const userId = session.user.id;

        if (!userId) {
            return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
        }

        // Find workshops where the user is in the attendees list
        const workshops = await Workshop.find({ attendees: userId })
            .sort({ date: 1 }); // Sort by upcoming

        return NextResponse.json({ workshops });
    } catch (error) {
        console.error("Failed to fetch workshops:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
