import { Session } from "next-auth";

interface LessonData {
    title: string;
    type: "video" | "article" | "resource";
    videoUrl?: string;
    videoDuration?: number;
    videoFilename?: string;
    articleContent?: string;
    resourceFiles?: Array<{
        url: string;
        type: string;
        name: string;
        size?: number;
    }>;
}

interface SectionData {
    title: string;
    lessons: LessonData[];
}

interface CourseFormData {
    title: string;
    subtitle: string;
    description: string;
    category: string;
    level: string;
    price: string;
    currency: string;
    thumbnail: string;
    promoVideo: string;
    learningOutcomes: string[];
    targetAudience: string[];
    prerequisites: string[];
    sections: SectionData[];
}

export interface CoursePreviewData {
    title: string;
    subtitle: string;
    description: string;
    thumbnail: string;
    promoVideo: string;
    learningOutcomes: string[];
    targetAudience: string[];
    prerequisites: string[];
    price: number;
    currency: string;
    level: string;
    category: string;
    sections: Array<{
        title: string;
        lessons: Array<{
            title: string;
            type: "video" | "article" | "resource";
            duration: number;
            isFree: boolean;
        }>;
    }>;
    instructor: {
        name: string;
        avatar?: string;
        bio: string;
    };
    totalStudents: number;
    averageRating: number;
    reviewCount: number;
    totalLectures: number;
    totalDuration: number;
    lastUpdated: string;
    createdAt: string;
    isPreview: true;
}

export function transformToCoursePreview(
    formData: CourseFormData,
    session: Session | null
): CoursePreviewData {
    // Calculate total lectures
    const totalLectures = formData.sections.reduce(
        (sum, section) => sum + section.lessons.length,
        0
    );

    // Calculate total duration (in seconds)
    const totalDuration = formData.sections.reduce((sectionSum, section) => {
        return sectionSum + section.lessons.reduce((lessonSum, lesson) => {
            return lessonSum + (lesson.videoDuration || 0);
        }, 0);
    }, 0);

    return {
        title: formData.title || "Untitled Course",
        subtitle: formData.subtitle || "",
        description: formData.description || "No description provided",
        thumbnail: formData.thumbnail || "/placeholder.png",
        promoVideo: formData.promoVideo || "",
        learningOutcomes: formData.learningOutcomes.filter(o => o.trim() !== ""),
        targetAudience: formData.targetAudience.filter(a => a.trim() !== ""),
        prerequisites: formData.prerequisites.filter(p => p.trim() !== ""),
        price: parseFloat(formData.price) || 0,
        currency: formData.currency || "USD",
        level: formData.level || "All Levels",
        category: formData.category || "Uncategorized",
        sections: formData.sections.map((section, sIndex) => ({
            title: section.title || `Section ${sIndex + 1}`,
            lessons: section.lessons.map((lesson, lIndex) => ({
                title: lesson.title || `Lesson ${lIndex + 1}`,
                type: lesson.type || "video",
                duration: lesson.videoDuration || 0,
                isFree: lIndex === 0 && sIndex === 0, // First lesson is free in preview
            })),
        })),
        instructor: {
            name: session?.user?.name || "Instructor",
            avatar: session?.user?.image || undefined,
            bio: "Preview Mode - Instructor details will appear here",
        },
        totalStudents: 0,
        averageRating: 0,
        reviewCount: 0,
        totalLectures,
        totalDuration,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isPreview: true,
    };
}

export function storePreviewData(data: CoursePreviewData): void {
    if (typeof window !== "undefined") {
        sessionStorage.setItem("coursePreview", JSON.stringify(data));
    }
}

export function getPreviewData(): CoursePreviewData | null {
    if (typeof window !== "undefined") {
        const data = sessionStorage.getItem("coursePreview");
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return null;
            }
        }
    }
    return null;
}

export function clearPreviewData(): void {
    if (typeof window !== "undefined") {
        sessionStorage.removeItem("coursePreview");
    }
}
