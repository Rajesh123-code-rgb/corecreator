import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    subtitle?: string;

    // Media
    image: string;
    mobileImage?: string;

    // Link
    link?: string;
    linkTarget: "_self" | "_blank";
    buttonText?: string;

    // Placement
    placement: "home_hero" | "home_secondary" | "category" | "product" | "checkout";
    categorySlug?: string;

    // Scheduling
    startDate?: Date;
    endDate?: Date;

    // Styling
    textColor?: string;
    backgroundColor?: string;

    // Status
    order: number;
    isActive: boolean;
    clicks: number;
    impressions: number;

    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
    {
        title: { type: String, required: true, maxlength: 100 },
        subtitle: { type: String, maxlength: 200 },
        image: { type: String, required: true },
        mobileImage: { type: String },
        link: { type: String },
        linkTarget: { type: String, enum: ["_self", "_blank"], default: "_self" },
        buttonText: { type: String, maxlength: 50 },
        placement: {
            type: String,
            enum: ["home_hero", "home_secondary", "category", "product", "checkout"],
            required: true,
            index: true,
        },
        categorySlug: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        textColor: { type: String, default: "#ffffff" },
        backgroundColor: { type: String, default: "#000000" },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true, index: true },
        clicks: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes
BannerSchema.index({ placement: 1, isActive: 1, order: 1 });
BannerSchema.index({ startDate: 1, endDate: 1 });

const Banner: Model<IBanner> = mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
