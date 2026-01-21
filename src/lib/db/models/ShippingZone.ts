import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShippingZone extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    countries: string[];
    states?: string[];

    // Shipping rates
    rates: {
        name: string;
        type: "flat" | "weight_based" | "price_based" | "free";
        amount: number;
        minWeight?: number;
        maxWeight?: number;
        minOrderValue?: number;
        maxOrderValue?: number;
        estimatedDays: { min: number; max: number };
    }[];

    isActive: boolean;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ShippingRateSchema = new Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ["flat", "weight_based", "price_based", "free"],
        default: "flat",
    },
    amount: { type: Number, default: 0 },
    minWeight: Number,
    maxWeight: Number,
    minOrderValue: Number,
    maxOrderValue: Number,
    estimatedDays: {
        min: { type: Number, default: 3 },
        max: { type: Number, default: 7 },
    },
}, { _id: false });

const ShippingZoneSchema = new Schema<IShippingZone>(
    {
        name: { type: String, required: true, maxlength: 100 },
        countries: [{ type: String }],
        states: [{ type: String }],
        rates: [ShippingRateSchema],
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Ensure only one default zone
ShippingZoneSchema.pre("save", async function (next: any) {
    if (this.isModified("countries")) {
        this.countries = this.countries.map((c: string) => c.trim().toUpperCase());
    }
    if (this.isDefault) {
        await mongoose.model("ShippingZone").updateMany(
            { _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});

const ShippingZone: Model<IShippingZone> = mongoose.models.ShippingZone || mongoose.model<IShippingZone>("ShippingZone", ShippingZoneSchema);

export default ShippingZone;
