"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Course from "@/lib/db/models/Course";
import { revalidatePath } from "next/cache";

export async function createCourse(formData: any) {
    try {
        // TEMPORARY: Bypass session check - TODO: Fix NextAuth session in App Router
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            throw new Error("Unauthorized: Please sign in");
        }

        // KYC Verification Check
        const User = (await import("@/lib/db/models/User")).default;
        const user = await User.findById(session.user.id);

        if (!user || user.kyc?.status !== "approved") {
            throw new Error("KYC Verification Required: Your studio must be verified to publish courses.");
        }

        const instructorId = session.user.id;
        const instructorName = session.user.name || "Instructor";

        // Generate slug from title
        const slug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            + "-" + Date.now().toString(36);

        // Create new course
        const course = await Course.create({
            title: formData.title,
            slug: slug,
            subtitle: formData.subtitle,
            description: formData.description,
            instructor: instructorId,
            instructorName: instructorName,
            category: formData.category,
            level: formData.level?.toLowerCase() || "all",
            price: parseFloat(formData.price) || 0,
            currency: formData.currency || "USD",
            thumbnail: formData.thumbnail || "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=225&fit=crop",
            previewVideo: formData.previewVideo || "",
            promoVideo: formData.promoVideo || "",

            // New fields
            learningOutcomes: formData.learningOutcomes?.filter((o: string) => o.trim() !== "") || [],
            targetAudience: formData.targetAudience?.filter((a: string) => a.trim() !== "") || [],
            prerequisites: formData.prerequisites?.filter((p: string) => p.trim() !== "") || [],

            // Sections (curriculum)
            sections: formData.sections?.map((section: any, sIndex: number) => ({
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
                })) || []
            })) || [],

            status: formData.status || "draft",
            isPublished: formData.status === "published",
            tags: [],
            language: "English"
        });

        // Revalidate the courses page
        revalidatePath("/studio/courses");

        return {
            success: true,
            course: {
                id: course._id.toString(),
                slug: course.slug,
                title: course.title
            }
        };

    } catch (error) {
        console.error("Error creating course:", error);

        // Extract meaningful error message
        let errorMessage = "Failed to create course";
        if (error instanceof Error) {
            errorMessage = error.message;
            console.error("Error details:", {
                message: error.message,
                stack: error.stack
            });
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}
