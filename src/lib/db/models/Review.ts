import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
    // Target - what is being reviewed
    targetType: "product" | "course" | "workshop" | "seller";
    targetId: mongoose.Types.ObjectId;

    // Reviewer
    user: mongoose.Types.ObjectId;

    // Review content
    rating: number; // 1-5
    title?: string;
    comment: string;

    // Media
    images?: string[];

    // Helpful votes
    helpfulCount: number;
    notHelpfulCount: number;

    // Status
    status: "pending" | "approved" | "rejected" | "flagged";
    isVerifiedPurchase: boolean;

    // Seller response
    sellerResponse?: {
        comment: string;
        respondedAt: Date;
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        targetType: {
            type: String,
            enum: ["product", "course", "workshop", "seller"],
            required: true,
            index: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "targetTypeRef",
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            maxlength: 150,
            trim: true,
        },
        comment: {
            type: String,
            required: true,
            maxlength: 2000,
            trim: true,
        },
        images: [{
            type: String,
        }],
        helpfulCount: {
            type: Number,
            default: 0,
        },
        notHelpfulCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "flagged"],
            default: "approved", // Auto-approve for now
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: false,
        },
        sellerResponse: {
            comment: String,
            respondedAt: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound index for finding reviews
ReviewSchema.index({ targetType: 1, targetId: 1 });
ReviewSchema.index({ targetType: 1, targetId: 1, user: 1 }, { unique: true }); // One review per user per target
ReviewSchema.index({ user: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

// Virtual for ref path
ReviewSchema.virtual("targetTypeRef").get(function () {
    const refMap: Record<string, string> = {
        product: "Product",
        course: "Course",
        workshop: "Workshop",
        seller: "User",
    };
    return refMap[this.targetType];
});

// Static method to calculate average rating for a target
ReviewSchema.statics.calculateAverageRating = async function (targetType: string, targetId: mongoose.Types.ObjectId) {
    const result = await this.aggregate([
        { $match: { targetType, targetId, status: "approved" } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                count: { $sum: 1 }
            }
        }
    ]);

    return result[0] || { avgRating: 0, count: 0 };
};

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
