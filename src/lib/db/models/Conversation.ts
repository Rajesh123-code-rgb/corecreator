import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
    _id: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    type: "direct" | "support" | "order";
    subject?: string;

    // Reference to related entity
    relatedTo?: {
        type: "order" | "product" | "course" | "workshop";
        id: mongoose.Types.ObjectId;
    };

    lastMessage?: {
        content: string;
        senderId: mongoose.Types.ObjectId;
        sentAt: Date;
    };

    unreadCount: Map<string, number>; // userId -> unread count

    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        participants: [{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }],
        type: {
            type: String,
            enum: ["direct", "support", "order"],
            default: "direct",
        },
        subject: {
            type: String,
            maxlength: 200,
        },
        relatedTo: {
            type: {
                type: String,
                enum: ["order", "product", "course", "workshop"],
            },
            id: Schema.Types.ObjectId,
        },
        lastMessage: {
            content: String,
            senderId: Schema.Types.ObjectId,
            sentAt: Date,
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: new Map(),
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Indexes
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ "lastMessage.sentAt": -1 });
ConversationSchema.index({ type: 1, isActive: 1 });

const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;
