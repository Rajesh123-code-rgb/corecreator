import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReturnRequestItem {
    itemId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    sellerId: mongoose.Types.ObjectId;
    sellerName?: string;
}

export interface IStudioFeedback {
    submittedBy: mongoose.Types.ObjectId;
    submittedAt: Date;
    message: string;
}

export interface IReturnRequest extends Document {
    requestNumber: string;
    order: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    item: IReturnRequestItem;
    type: "return" | "refund";
    reason: "damaged" | "wrong_item" | "not_as_described" | "defective" | "other";
    description: string;
    evidence: {
        type: "image" | "video";
        url: string;
        filename?: string;
    }[];
    status: "pending" | "under_review" | "approved" | "rejected" | "completed";
    adminReview?: {
        reviewedBy: mongoose.Types.ObjectId;
        reviewedAt: Date;
        decision: "approved" | "rejected";
        notes: string;
        refundAmount?: number;
    };
    studioFeedback: IStudioFeedback[];
    refundAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const returnRequestItemSchema = new Schema<IReturnRequestItem>({
    itemId: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerName: { type: String },
});

const studioFeedbackSchema = new Schema<IStudioFeedback>({
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, default: Date.now },
    message: { type: String, required: true },
});

const returnRequestSchema = new Schema<IReturnRequest>(
    {
        requestNumber: { type: String, required: true, unique: true },
        order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        item: { type: returnRequestItemSchema, required: true },
        type: {
            type: String,
            enum: ["return", "refund"],
            required: true
        },
        reason: {
            type: String,
            enum: ["damaged", "wrong_item", "not_as_described", "defective", "other"],
            required: true
        },
        description: { type: String, required: true },
        evidence: [{
            type: { type: String, enum: ["image", "video"], required: true },
            url: { type: String, required: true },
            filename: { type: String },
        }],
        status: {
            type: String,
            enum: ["pending", "under_review", "approved", "rejected", "completed"],
            default: "pending"
        },
        adminReview: {
            reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
            reviewedAt: { type: Date },
            decision: { type: String, enum: ["approved", "rejected"] },
            notes: { type: String },
            refundAmount: { type: Number },
        },
        studioFeedback: [studioFeedbackSchema],
        refundAmount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes
returnRequestSchema.index({ requestNumber: 1 });
returnRequestSchema.index({ order: 1 });
returnRequestSchema.index({ user: 1 });
returnRequestSchema.index({ "item.sellerId": 1 });
returnRequestSchema.index({ status: 1 });
returnRequestSchema.index({ createdAt: -1 });

// Generate request number before save
returnRequestSchema.pre("save", async function (next: any) {
    if (this.isNew && !this.requestNumber) {
        const count = await ReturnRequest.countDocuments();
        this.requestNumber = `RET-${String(count + 1).padStart(6, "0")}`;
    }
    next();
});

const ReturnRequest: Model<IReturnRequest> =
    mongoose.models.ReturnRequest || mongoose.model<IReturnRequest>("ReturnRequest", returnRequestSchema);

export default ReturnRequest;
