import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkshop extends Document {
    title: string;
    slug: string;
    description: string;

    // Instructor
    instructor: mongoose.Types.ObjectId;
    instructorName: string;
    instructorAvatar?: string;

    // Date & Time
    date: Date;
    duration: number; // in minutes

    // Workshop Type
    workshopType: "online" | "offline";

    // Location (for offline workshops)
    location?: {
        country: string;
        city: string;
        address: string;
    };

    // Online Meeting Details (for online workshops)
    meetingUrl?: string; // Zoom/Google Meet link
    meetingUserId?: string;
    meetingPassword?: string;

    // Details
    capacity: number;
    enrolledCount: number;
    price: number;
    currency: string;

    // Content
    thumbnail: string;
    requirements?: string[];
    agenda?: string[];

    // Categorization
    category: string;
    tags: string[];
    level: "beginner" | "intermediate" | "advanced" | "all";

    // Status
    status: "draft" | "pending" | "upcoming" | "rejected" | "completed" | "cancelled" | "blocked";
    rejectionReason?: string;
    submittedAt?: Date;
    reviewedAt?: Date;

    attendees: mongoose.Types.ObjectId[];

    createdAt: Date;
    updatedAt: Date;
}

const workshopSchema = new Schema<IWorkshop>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: { type: String, required: true },

        instructor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        instructorName: { type: String, required: true },
        instructorAvatar: { type: String },

        date: { type: Date, required: true, index: true },
        duration: { type: Number, required: true }, // minutes

        // Workshop Type
        workshopType: { type: String, enum: ["online", "offline"], default: "online" },

        // Location (for offline workshops)
        location: {
            country: { type: String },
            city: { type: String },
            address: { type: String },
        },

        // Online Meeting Details
        meetingUrl: { type: String },
        meetingUserId: { type: String },
        meetingPassword: { type: String },

        capacity: { type: Number, required: true },
        enrolledCount: { type: Number, default: 0 },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, default: "USD" },

        thumbnail: { type: String, required: true },
        requirements: [{ type: String }],
        agenda: [{ type: String }],

        category: { type: String, required: true, index: true },
        tags: [{ type: String }],
        level: { type: String, enum: ["beginner", "intermediate", "advanced", "all"], default: "all" },

        status: { type: String, enum: ["draft", "pending", "upcoming", "rejected", "completed", "cancelled", "blocked"], default: "draft", index: true },
        rejectionReason: { type: String },
        submittedAt: { type: Date },
        reviewedAt: { type: Date },

        attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

// Indexes
workshopSchema.index({ title: "text", description: "text", tags: "text" });
workshopSchema.index({ date: 1 });

// Generate slug before validation
workshopSchema.pre("validate", function () {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            + "-" + Date.now().toString(36);
    }
});

// Delete cached model to ensure schema updates are applied
if (mongoose.models.Workshop) {
    delete mongoose.models.Workshop;
}

const Workshop: Model<IWorkshop> = mongoose.model<IWorkshop>("Workshop", workshopSchema);

export default Workshop;

