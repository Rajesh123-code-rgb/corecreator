import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
    | "order_placed"
    | "order_shipped"
    | "order_delivered"
    | "order_cancelled"
    | "payout_processed"
    | "payout_pending"
    | "review_received"
    | "course_enrolled"
    | "course_completed"
    | "workshop_reminder"
    | "product_approved"
    | "product_rejected"
    | "new_follower"
    | "message_received"
    | "system_announcement"
    | "promo_code_applied"
    | "studio_verified"
    | "studio_rejected"
    | "course_approved"
    | "course_rejected"
    | "payout_requested";

export type RecipientModel = "User" | "Studio" | "Admin";

export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    recipientModel: RecipientModel;
    type: NotificationType;
    title: string;
    message: string;
    data?: {
        orderId?: string;
        payoutId?: string;
        productId?: string;
        courseId?: string;
        workshopId?: string;
        userId?: string;
        studioId?: string;
        link?: string;
    };
    read: boolean;
    readAt?: Date;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'recipientModel',
            index: true
        },
        recipientModel: {
            type: String,
            required: true,
            enum: ["User", "Studio", "Admin"],
            default: "User"
        },
        type: {
            type: String,
            required: true,
            enum: [
                "order_placed",
                "order_shipped",
                "order_delivered",
                "order_cancelled",
                "payout_processed",
                "payout_pending",
                "review_received",
                "course_enrolled",
                "course_completed",
                "workshop_reminder",
                "product_approved",
                "product_rejected",
                "new_follower",
                "message_received",
                "system_announcement",
                "promo_code_applied",
                "studio_verified",
                "studio_rejected",
                "course_approved",
                "course_rejected",
                "payout_requested"
            ]
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: {
            orderId: String,
            payoutId: String,
            productId: String,
            courseId: String,
            workshopId: String,
            userId: String,
            studioId: String,
            link: String,
        },
        read: { type: Boolean, default: false, index: true },
        readAt: { type: Date },
    },
    { timestamps: true }
);

// Compound index for efficient querying
NotificationSchema.index({ recipientId: 1, recipientModel: 1, read: 1, createdAt: -1 });

// Clean up old read notifications (older than 30 days)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { read: true } });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;

// Helper function to create notification
export async function createNotification({
    recipientId,
    recipientModel = "User",
    type,
    title,
    message,
    data,
}: {
    recipientId: string | mongoose.Types.ObjectId;
    recipientModel?: RecipientModel;
    type: NotificationType;
    title: string;
    message: string;
    data?: INotification["data"];
}): Promise<INotification> {
    const notification = await Notification.create({
        recipientId: new mongoose.Types.ObjectId(recipientId.toString()),
        recipientModel,
        type,
        title,
        message,
        data,
    });
    return notification;
}

// Get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
        order_placed: "🛒",
        order_shipped: "📦",
        order_delivered: "✅",
        order_cancelled: "❌",
        payout_processed: "💰",
        payout_pending: "⏳",
        review_received: "⭐",
        course_enrolled: "📚",
        course_completed: "🎓",
        workshop_reminder: "🔔",
        product_approved: "✓",
        product_rejected: "✗",
        new_follower: "👤",
        message_received: "💬",
        system_announcement: "📢",
        promo_code_applied: "🎁",
        studio_verified: "✅",
        studio_rejected: "❌",
        course_approved: "✅",
        course_rejected: "❌",
        payout_requested: "💸",
    };
    return icons[type] || "📬";
}
