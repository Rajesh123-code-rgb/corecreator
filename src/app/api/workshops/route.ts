import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Workshop from '@/lib/db/models/Workshop';
import User from '@/lib/db/models/User';

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const instructorId = searchParams.get('instructor');
        const slug = searchParams.get('slug');
        const limit = searchParams.get('limit');
        const sort = searchParams.get('sort') || 'upcoming';

        // Build query
        const query: any = { status: 'upcoming' }; // Only show published workshops by default

        if (slug) {
            query.slug = slug;
        }

        if (instructorId) {
            query.instructor = instructorId;
        }

        // Execute query
        let workshopQuery = Workshop.find(query)
            .populate('instructor', 'name avatar bio rating reviews') // Populate instructor details
            .select('-meetingUrl'); // Exclude meeting URL for public view security

        // Apply sorting
        switch (sort) {
            case 'price_low':
                workshopQuery = workshopQuery.sort({ price: 1 });
                break;
            case 'price_high':
                workshopQuery = workshopQuery.sort({ price: -1 });
                break;
            case 'popular':
                workshopQuery = workshopQuery.sort({ enrolledCount: -1 });
                break;
            case 'newest':
                workshopQuery = workshopQuery.sort({ createdAt: -1 });
                break;
            case 'upcoming':
            default:
                workshopQuery = workshopQuery.sort({ date: 1 });
        }

        // Apply limit
        if (limit) {
            workshopQuery = workshopQuery.limit(parseInt(limit));
        }

        const workshops = await workshopQuery.exec();

        // Transform data to match expected frontend format if necessary
        const formattedWorkshops = workshops.map(workshop => {
            const workshopObj = workshop.toObject();
            const instructor = workshopObj.instructor as any;

            return {
                ...workshopObj,
                id: workshopObj._id.toString(), // Ensure ID is string
                instructor: {
                    id: instructor?._id?.toString() || "unknown",
                    name: workshop.instructorName, // Fallback to denormalized name
                    avatar: workshop.instructorAvatar, // Fallback to denormalized avatar
                    bio: instructor?.bio || `Professional instructor`,
                    rating: instructor?.rating || 4.8,
                    reviews: instructor?.reviews || 0
                }
            };
        });

        return NextResponse.json(formattedWorkshops);
    } catch (error) {
        console.error("Failed to fetch public workshops:", error);
        return NextResponse.json({ error: "Failed to fetch workshops" }, { status: 500 });
    }
}

