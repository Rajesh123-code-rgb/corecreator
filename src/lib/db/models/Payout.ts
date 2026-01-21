import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayout extends Document {
    seller: mongoose.Types.ObjectId;
    sellerEmail: string;
    sellerName: string;

    // Amount details
    amount: number;
    currency: string;

    // Earnings breakdown
    grossEarnings: number;    // Total sales before fees
    platformFees: number;     // Platform commission
    processingFees: number;   // Payment processing fees
    netEarnings: number;      // Amount to pay seller

    // Status
    status: "pending" | "processing" | "completed" | "failed" | "cancelled";

    // Payment method
    paymentMethod: "bank_transfer" | "paypal" | "razorpay_payout" | "manual";
    paymentDetails?: {
        bankAccountLast4?: string;
        bankName?: string;
        transactionId?: string;
        paypalEmail?: string;
        notes?: string;
    };

    // Period covered
    periodStart: Date;
    periodEnd: Date;

    // Orders included in this payout
    orderIds: mongoose.Types.ObjectId[];
    orderCount: number;

    // Admin who processed
    processedBy?: mongoose.Types.ObjectId;
    processedAt?: Date;

    // Failure details
    failureReason?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const payoutSchema = new Schema<IPayout>(
    {
        seller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        sellerEmail: { type: String, required: true },
        sellerName: { type: String, required: true },

        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: "INR" },

        grossEarnings: { type: Number, required: true },
        platformFees: { type: Number, required: true },
        processingFees: { type: Number, required: true },
        netEarnings: { type: Number, required: true },

        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed", "cancelled"],
            default: "pending",
            index: true
        },

        paymentMethod: {
            type: String,
            enum: ["bank_transfer", "paypal", "razorpay_payout", "manual"],
            required: true
        },
        paymentDetails: {
            bankAccountLast4: String,
            bankName: String,
            transactionId: String,
            paypalEmail: String,
            notes: String
        },

        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },

        orderIds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
        orderCount: { type: Number, default: 0 },

        processedBy: { type: Schema.Types.ObjectId, ref: "User" },
        processedAt: { type: Date },

        failureReason: { type: String }
    },
    { timestamps: true }
);

// Indexes
payoutSchema.index({ createdAt: -1 });
payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });

const Payout: Model<IPayout> =
    mongoose.models.Payout || mongoose.model<IPayout>("Payout", payoutSchema);

export default Payout;
