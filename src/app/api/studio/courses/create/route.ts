import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const data = await req.json();

        // Try to get session - use alternate method for App Router
        const session = await getServerSession(authOptions);

        console.log("Session check:", {
            hasSession: !!session,
            userId: session?.user?.id,
            userName: session?.user?.name
        });

        // If no session, return 401
        if (!session?.user?.id) {
            return NextResponse.json({
                error: "Please log in to create a course"
            }, { status: 401 });
        }

        console.log("Creating course for instructor:", session.user.name);

        // Create new course
        const course = await Course.create({
            title: data.title,
            subtitle: data.subtitle,
            description: data.description,
            instructor: session.user.id,
            instructorName: session.user.name || "Unknown",
            category: data.category,
            level: data.level?.toLowerCase() || "all",
            price: parseFloat(data.price) || 0,
            currency: data.currency || "USD",
            thumbnail: data.thumbnail || "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=225&fit=crop",
            previewVideo: data.previewVideo || "",

            // Sections (curriculum) - match the ISection interface
            sections: data.sections?.map((section: any, sIndex: number) => ({
                title: section.title,
                description: section.description || "",
                order: sIndex,
                lessons: section.lessons?.map((lesson: any, lIndex: number) => ({
                    title: lesson.title,
                    type: lesson.type || "video",
                    description: lesson.description || "",
                    content: {
                        videoUrl: lesson.videoUrl || "",
                        videoDuration: lesson.videoDuration || 0,
                        textContent: lesson.textContent || "",
                        attachments: lesson.attachments || []
                    },
                    order: lIndex,
                    isFree: lIndex === 0, // First lesson free
                    isPublished: true
                })) || []
            })) || [],

            // Optional arrays
            prerequisites: data.requirements || data.prerequisites || [],
            learningOutcomes: data.whatYouWillLearn || data.learningOutcomes || [],
            targetAudience: data.targetAudience || [],
            tags: data.tags || [],
            language: data.language || "English",

            // Status
            status: data.status || "draft",
        });

        return NextResponse.json({
            success: true,
            course: {
                id: course._id,
                slug: course.slug,
                title: course.title
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json(
            { error: "Failed to create course" },
            { status: 500 }
        );
    }
}
