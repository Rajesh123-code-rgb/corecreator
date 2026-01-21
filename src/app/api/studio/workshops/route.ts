import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Workshop from "@/lib/db/models/Workshop";
import User from "@/lib/db/models/User";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = new mongoose.Types.ObjectId(session.user.id);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status"); // draft, upcoming, completed, cancelled

        // Build query - filter by instructor
        const query: Record<string, unknown> = { instructor: userId };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const [workshops, total] = await Promise.all([
            Workshop.find(query)
                .sort({ date: 1 }) // Sort by date ascending (upcoming first)
                .skip(skip)
                .limit(limit)
                .select("title date duration capacity enrolledCount price currency status thumbnail category level createdAt updatedAt slug meetingUrl")
                .lean(),
            Workshop.countDocuments(query),
        ]);

        // Format workshops for frontend
        const formattedWorkshops = workshops.map(workshop => ({
            id: workshop._id.toString(),
            title: workshop.title,
            slug: workshop.slug,
            date: workshop.date,
            duration: workshop.duration,
            capacity: workshop.capacity,
            enrolled: workshop.enrolledCount || 0,
            price: workshop.price,
            currency: workshop.currency || "INR",
            status: workshop.status,
            category: workshop.category,
            level: workshop.level,
            thumbnail: workshop.thumbnail || "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=100&h=60&fit=crop",
            meetingUrl: workshop.meetingUrl,
            createdAt: workshop.createdAt,
            updatedAt: workshop.updatedAt
        }));

        return NextResponse.json({
            workshops: formattedWorkshops,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Studio Workshops API Error:", error);
        return NextResponse.json({ error: "Failed to fetch workshops" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const body = await request.json();

        console.log("Workshop creation request:", JSON.stringify(body, null, 2));

        // Validate required fields (price can be 0 for free workshops)
        const requiredFields = ["title", "description", "date", "duration", "capacity", "category", "thumbnail"];
        for (const field of requiredFields) {
            if (!body[field]) {
                console.log(`Missing required field: ${field}`);
                return NextResponse.json({ error: `${field} is required` }, { status: 400 });
            }
        }

        // Validate price separately (can be 0 or empty string for free)
        const price = parseFloat(body.price) || 0;

        // Get instructor info and check KYC
        const user = await User.findById(session.user.id).select("name avatar kyc");
        if (!user) {
            console.log("User not found:", session.user.id);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.kyc?.status !== "approved") {
            return NextResponse.json({ error: "KYC verification required to list workshops" }, { status: 403 });
        }

        // Create workshop
        const workshop = new Workshop({
            title: body.title,
            description: body.description,

            // Instructor details
            instructor: session.user.id,
            instructorName: user.name || session.user.name || "Instructor",
            instructorAvatar: user.avatar || session.user.image,

            // Date & Time
            date: new Date(body.date),
            duration: parseInt(body.duration) || 60,

            // Capacity & Pricing
            capacity: parseInt(body.capacity) || 20,
            price: price,
            currency: body.currency || "INR",

            // Content
            thumbnail: body.thumbnail,
            meetingUrl: body.meetingUrl || "",
            requirements: body.requirements || [],
            agenda: body.agenda || [],

            // Categorization
            category: body.category,
            tags: body.tags || [],
            level: body.level || "all",

            // Status
            status: body.status || "draft",
        });

        await workshop.save();

        console.log("Workshop created successfully:", workshop._id);

        return NextResponse.json({
            message: "Workshop created successfully",
            workshop: {
                id: workshop._id.toString(),
                slug: workshop.slug,
                title: workshop.title,
                status: workshop.status
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Workshop Create Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create workshop";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}


