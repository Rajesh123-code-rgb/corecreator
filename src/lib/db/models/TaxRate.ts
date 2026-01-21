import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITaxRate extends Document {
    name: string;      // e.g., "GST Standard", "VAT UK"
    rate: number;      // e.g., 18.0
    country: string;   // e.g., "IN", "US", "GB"
    region?: string;   // e.g., "MH", "CA" (optional State/Province)
    isActive: boolean;
    description?: string;
    applyTo: "all" | "shipping" | "digital";
    isCompound: boolean;
    displayName: string;
    isInclusive: boolean;
    priority: number;
}

const TaxRateSchema = new Schema<ITaxRate>(
    {
        name: { type: String, required: true, trim: true },
        rate: { type: Number, required: true, min: 0, max: 100 },
        country: { type: String, required: true, uppercase: true, trim: true },
        region: { type: String, uppercase: true, trim: true },
        isActive: { type: Boolean, default: true },
        description: String,
        applyTo: { type: String, enum: ["all", "shipping", "digital"], default: "all" },
        isCompound: { type: Boolean, default: false },
        displayName: { type: String },
        isInclusive: { type: Boolean, default: false },
        priority: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure uniqueness for a region/country combo if needed, 
// but for flexibility we might allow multiple (e.g. reduced rate vs standard)
TaxRateSchema.index({ country: 1, region: 1, name: 1 }, { unique: true });

const TaxRate: Model<ITaxRate> =
    mongoose.models.TaxRate || mongoose.model<ITaxRate>("TaxRate", TaxRateSchema);

export default TaxRate;
