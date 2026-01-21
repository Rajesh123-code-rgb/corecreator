import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProgress extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    lessonId: string;
    watchTime: number; // seconds watched
    duration: number; // total duration
    percentage: number; // 0-100
    completed: boolean;
    lastWatched: Date;
    createdAt: Date;
    updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true
        },
        lessonId: {
            type: String,
            required: true
        },
        watchTime: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        completed: {
            type: Boolean,
            default: false
        },
        lastWatched: {
            type: Date,
            default: Date.now
        },
    },
    { timestamps: true }
);

// Compound index for efficient queries
progressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

// Calculate percentage before saving
progressSchema.pre("save", function (next: any) {
    if (this.duration > 0) {
        this.percentage = Math.min(100, Math.round((this.watchTime / this.duration) * 100));
    }
    if (this.percentage >= 90) {
        this.completed = true;
    }
    this.updatedAt = new Date();
    next();
});

const Progress: Model<IProgress> =
    mongoose.models.Progress || mongoose.model<IProgress>("Progress", progressSchema);

export default Progress;
