import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { id } = await context.params;
        const data = await req.json();

        const course = await Course.findById(id);
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        console.log("Updating curriculum for course:", id);
        console.log("Received sections:", JSON.stringify(data.sections, null, 2));

        // Update curriculum sections with direct document assignment
        course.sections = data.sections.map((section: any, sIndex: number) => ({
            title: section.title,
            description: section.description || "",
            order: sIndex,
            lessons: section.lessons.map((lesson: any, lIndex: number) => ({
                title: lesson.title,
                type: lesson.type || "video",
                description: lesson.description || "",
                content: {
                    videoUrl: lesson.videoUrl || "",
                    videoDuration: lesson.videoDuration || 0,
                    videoFilename: lesson.videoFilename || "",
                    articleContent: lesson.articleContent || "",
                    resourceFiles: lesson.resourceFiles || [],
                    textContent: lesson.textContent || "",
                    attachments: lesson.attachments || [],
                    projectContent: lesson.projectContent ? {
                        instructions: lesson.projectContent.instructions || "",
                        expectedOutcome: lesson.projectContent.expectedOutcome || "",
                        referenceImages: lesson.projectContent.referenceImages || []
                    } : undefined
                },
                order: lIndex,
                isFree: lIndex === 0,
                isPublished: true
            }))
        }));

        await course.save();

        console.log("Curriculum updated successfully");
        console.log("Saved sections:", JSON.stringify(course.sections, null, 2));

        // Fetch fresh from DB
        const updatedCourse = await Course.findById(id).lean();

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("Error updating curriculum:", error);
        return NextResponse.json({ error: "Failed to update curriculum" }, { status: 500 });
    }
}
