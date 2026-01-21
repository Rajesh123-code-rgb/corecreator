import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
    itemType: "product" | "course" | "workshop";
    itemId: mongoose.Types.ObjectId;
    sellerId?: mongoose.Types.ObjectId; // Studio/Creator who gets paid
    sellerName?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    // Payout tracking
    payoutStatus?: "pending" | "included" | "paid" | "refunded";
    payoutId?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
    orderNumber: string;
    user: mongoose.Types.ObjectId;
    items: IOrderItem[];

    // Pricing
    subtotal: number;
    shipping: number;
    discount: number;
    tax: number;
    total: number;

    // Promo code
    promoCode?: string;
    promoDiscount?: number;

    // Payment
    paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
    paymentMethod: "razorpay" | "stripe" | "paypal" | "cod";
    paymentDetails?: {
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        method?: string;
        amount?: number;
        currency?: string;
        paidAt?: Date;
        failureReason?: string;
    };

    // Refund details
    refundDetails?: {
        amount: number;
        status: string;
        processedAt: Date;
    };

    // Order status
    status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

    // Shipping (for physical products)
    shippingAddress?: {
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    // Shipping Tracking
    shippingTracking?: {
        carrier: string;
        trackingNumber: string;
        trackingUrl?: string;
        estimatedDelivery?: Date;
    };

    // Order Tracking History
    trackingHistory: {
        status: string;
        timestamp: Date;
        message: string;
        updatedBy?: mongoose.Types.ObjectId;
    }[];

    // Analytics & Attribution
    attribution?: {
        source?: string;   // e.g. "google", "newsletter"
        medium?: string;   // e.g. "cpc", "email"
        campaign?: string; // e.g. "summer_sale"
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
    itemType: { type: String, enum: ["product", "course", "workshop"], required: true },
    itemId: { type: Schema.Types.ObjectId, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sellerName: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    payoutStatus: { type: String, enum: ["pending", "included", "paid", "refunded"], default: "pending" },
    payoutId: { type: Schema.Types.ObjectId, ref: "Payout" }
});

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        items: [orderItemSchema],

        subtotal: { type: Number, required: true },
        shipping: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },

        promoCode: { type: String },
        promoDiscount: { type: Number },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["razorpay", "stripe", "paypal", "cod"],
            required: true,
        },
        paymentDetails: {
            razorpayOrderId: String,
            razorpayPaymentId: String,
            method: String,
            amount: Number,
            currency: String,
            paidAt: Date,
            failureReason: String,
        },

        refundDetails: {
            amount: Number,
            status: String,
            processedAt: Date,
        },

        status: {
            type: String,
            enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
            default: "pending",
        },

        shippingAddress: {
            fullName: String,
            phone: String,
            addressLine1: String,
            addressLine2: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        },
        shippingTracking: {
            carrier: String,
            trackingNumber: String,
            trackingUrl: String,
            estimatedDelivery: Date,
        },
        trackingHistory: [{
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            message: { type: String, required: true },
            updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
        }],
        attribution: {
            source: String,
            medium: String,
            campaign: String,
        },
    },
    { timestamps: true }
);

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before save
orderSchema.pre("save", async function () {
    if (this.isNew && !this.orderNumber) {
        const count = await Order.countDocuments();
        this.orderNumber = `ORD-${String(count + 1).padStart(6, "0")}`;
    }
    this.updatedAt = new Date();
    // Add logic to calculate totalAmount if needed
});

const Order: Model<IOrder> =
    mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
