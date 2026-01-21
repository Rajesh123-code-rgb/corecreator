import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPromoCode extends Document {
    code: string;
    name: string;
    description?: string;

    // Discount settings
    discountType: "percentage" | "fixed";
    discountValue: number;
    maxDiscount?: number; // For percentage discounts

    // Validity
    startDate: Date;
    endDate: Date;
    isActive: boolean;

    // Usage limits
    usageLimit?: number;
    usageLimitPerUser?: number;
    usedCount: number;

    // Conditions
    minPurchaseAmount?: number;
    applicableTo: {
        type: "all" | "courses" | "products" | "workshops" | "specific";
        items?: mongoose.Types.ObjectId[];
        categories?: string[];
    };

    // Exclusions
    excludeItems?: mongoose.Types.ObjectId[];
    excludeCategories?: string[];

    // Created by
    createdBy: mongoose.Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>(
    {
        code: { type: String, required: true, unique: true, uppercase: true },
        name: { type: String, required: true },
        description: { type: String },

        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },
        discountValue: { type: Number, required: true, min: 0 },
        maxDiscount: { type: Number, min: 0 },

        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },

        usageLimit: { type: Number, min: 1 },
        usageLimitPerUser: { type: Number, min: 1 },
        usedCount: { type: Number, default: 0 },

        minPurchaseAmount: { type: Number, min: 0 },
        applicableTo: {
            type: {
                type: String,
                enum: ["all", "courses", "products", "workshops", "specific"],
                default: "all",
            },
            items: [{ type: Schema.Types.ObjectId }],
            categories: [{ type: String }],
        },

        excludeItems: [{ type: Schema.Types.ObjectId }],
        excludeCategories: [{ type: String }],

        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const PromoCode: Model<IPromoCode> =
    mongoose.models.PromoCode || mongoose.model<IPromoCode>("PromoCode", promoCodeSchema);

export default PromoCode;
