import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEnquiry extends Document {
    name: string;
    email: string;
    phone: string;
    message?: string;
    type: "maintenance" | "contact" | "newsletter" | "other";
    source?: string;
    status: "new" | "read" | "contacted" | "archived";
    createdAt: Date;
    updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        message: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ["maintenance", "contact", "newsletter", "other"],
            default: "maintenance",
        },
        source: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["new", "read", "contacted", "archived"],
            default: "new",
        },
    },
    {
        timestamps: true,
    }
);

// Index for sorting by date
EnquirySchema.index({ createdAt: -1 });

const Enquiry: Model<IEnquiry> =
    mongoose.models.Enquiry || mongoose.model<IEnquiry>("Enquiry", EnquirySchema);

export default Enquiry;
