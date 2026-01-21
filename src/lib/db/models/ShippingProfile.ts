import mongoose, { Schema, Document, Model } from "mongoose";

interface IShippingRate {
    name: string; // e.g., "Standard", "Express"
    type: "flat" | "weight_based" | "price_based" | "free";
    amount: number;
    minWeight?: number;
    maxWeight?: number;
    minPrice?: number;
    maxPrice?: number;
}

interface IShippingZone {
    name: string; // e.g., "Domestic", "North America"
    countries: string[]; // ISO country codes
    rates: IShippingRate[];
}

export interface IShippingProfile extends Document {
    name: string;
    seller: mongoose.Types.ObjectId;
    zones: IShippingZone[];
    processingTime?: string; // e.g. "1-2 days" - Overrides product default if set
    isDefault: boolean; // One default per seller
    createdAt: Date;
    updatedAt: Date;
}

const ShippingRateSchema = new Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ["flat", "weight_based", "price_based", "free"],
        required: true
    },
    amount: { type: Number, required: true, min: 0 },
    minWeight: { type: Number },
    maxWeight: { type: Number },
    minPrice: { type: Number },
    maxPrice: { type: Number },
}, { _id: false });

const ShippingZoneSchema = new Schema({
    name: { type: String, required: true },
    countries: [{ type: String }], // Array of country codes
    rates: [ShippingRateSchema]
}, { _id: false });

const ShippingProfileSchema = new Schema<IShippingProfile>(
    {
        name: { type: String, required: true, trim: true },
        seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        zones: [ShippingZoneSchema],
        processingTime: { type: String },
        isDefault: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// Ensure one default per seller
ShippingProfileSchema.pre("save", async function () {
    if (this.isDefault) {
        const ShippingProfile = mongoose.model("ShippingProfile");
        await ShippingProfile.updateMany(
            { seller: this.seller, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
});

const ShippingProfile: Model<IShippingProfile> =
    mongoose.models.ShippingProfile || mongoose.model<IShippingProfile>("ShippingProfile", ShippingProfileSchema);

export default ShippingProfile;
