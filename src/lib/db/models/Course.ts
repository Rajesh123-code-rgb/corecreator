import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILesson {
    title: string;
    description?: string;
    type: "video" | "article" | "resource" | "project";
    content: {
        videoUrl?: string;
        videoDuration?: number;
        articleContent?: string; // HTML or Markdown content for articles
        resourceFiles?: Array<{
            url: string;
            type: string; // e.g., "pdf", "png", "jpg"
            name: string;
            size?: number; // in bytes
        }>;
        textContent?: string;
        attachments?: string[];
        // Project Specific
        projectContent?: {
            instructions: string; // HTML
            expectedOutcome?: string;
            referenceImages?: string[];
        };
    };
    order: number;
    isFree: boolean;
    isPublished: boolean;
}

export interface ISection {
    title: string;
    description?: string;
    lessons: ILesson[];
    order: number;
}

export interface ICourse extends Document {
    title: string;
    slug: string;
    subtitle?: string;
    description: string;

    // Media
    thumbnail: string;
    previewVideo?: string;
    promoVideo?: string; // NEW

    // Course Content Info
    learningOutcomes: string[]; // NEW - What students will learn
    targetAudience: string[]; // NEW - Who this course is for
    prerequisites: string[]; // NEW - What students need before starting

    // Pricing
    price: number;
    compareAtPrice?: number;
    currency: string;

    // Categorization
    category: string;
    subcategory?: string;
    tags: string[];
    level: "beginner" | "intermediate" | "advanced" | "all";
    language: string;

    // Instructor
    instructor: mongoose.Types.ObjectId;
    instructorName: string;
    instructorAvatar?: string;

    // Content
    sections: ISection[];

    // Stats
    totalDuration: number;
    totalLectures: number;
    totalStudents: number;
    averageRating: number;
    totalReviews: number;

    // Status
    status: "draft" | "pending" | "published" | "rejected" | "archived" | "blocked";
    isPublished: boolean;
    publishedAt?: Date;
    rejectionReason?: string;
    submittedAt?: Date;
    reviewedAt?: Date;

    // SEO
    metaTitle?: string;
    metaDescription?: string;

    createdAt: Date;
    updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["video", "article", "resource", "project"], default: "video" },
    content: {
        videoUrl: { type: String },
        videoDuration: { type: Number },
        articleContent: { type: String },
        resourceFiles: [{
            url: { type: String },
            type: { type: String },
            name: { type: String },
            size: { type: Number }
        }],
        textContent: { type: String },
        attachments: [{ type: String }],
        projectContent: {
            instructions: { type: String },
            expectedOutcome: { type: String },
            referenceImages: [{ type: String }]
        }
    },
    order: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
});

const sectionSchema = new Schema<ISection>({
    title: { type: String, required: true },
    description: { type: String },
    lessons: [lessonSchema],
    order: { type: Number, required: true },
});

const courseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        subtitle: { type: String },
        description: { type: String, required: true },

        // Media
        thumbnail: { type: String, required: true },
        previewVideo: { type: String },
        promoVideo: { type: String },

        // Course Content Info
        learningOutcomes: [{ type: String }],
        targetAudience: [{ type: String }],
        prerequisites: [{ type: String }],

        // Pricing
        price: { type: Number, required: true, min: 0 },
        compareAtPrice: { type: Number, min: 0 },
        currency: { type: String, default: "USD" },

        // Categorization
        category: { type: String, required: true, index: true },
        subcategory: { type: String, index: true },
        tags: [{ type: String }],
        level: { type: String, enum: ["beginner", "intermediate", "advanced", "all"], default: "all" },
        language: { type: String, default: "English" },

        // Instructor
        instructor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        instructorName: { type: String, required: true },
        instructorAvatar: { type: String },

        // Content
        sections: [sectionSchema],

        // Stats
        totalDuration: { type: Number, default: 0 },
        totalLectures: { type: Number, default: 0 },
        totalStudents: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },

        // Status
        status: { type: String, enum: ["draft", "pending", "published", "rejected", "archived", "blocked"], default: "draft", index: true },
        isPublished: { type: Boolean, default: false },
        publishedAt: { type: Date },
        rejectionReason: { type: String }, // NEW: feedback for authors
        submittedAt: { type: Date },
        reviewedAt: { type: Date },

        // SEO
        metaTitle: { type: String },
        metaDescription: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes
courseSchema.index({ title: "text", description: "text", tags: "text" });
courseSchema.index({ price: 1 });
courseSchema.index({ rating: -1, enrollmentCount: -1 });

// Generate slug
courseSchema.pre("save", function (next: any) {
    if (this.isModified("title") && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            + "-" + Date.now().toString(36);
    }

    // Calculate totals
    let totalLessons = 0;
    let totalDuration = 0;
    this.sections.forEach((section: ISection) => {
        totalLessons += section.lessons.length;
        section.lessons.forEach((lesson: ILesson) => {
            if (lesson.content.videoDuration) {
                totalDuration += lesson.content.videoDuration;
            }
        });
    });
    this.totalLectures = totalLessons;
    this.totalDuration = totalDuration;
});

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);

export default Course;
