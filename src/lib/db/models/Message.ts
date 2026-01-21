import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;

    content: string;

    // Attachments
    attachments?: {
        type: "image" | "file" | "link";
        url: string;
        name?: string;
        size?: number;
    }[];

    // Read receipts
    readBy: {
        userId: mongoose.Types.ObjectId;
        readAt: Date;
    }[];

    isSystem: boolean; // System-generated message
    isDeleted: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000,
        },
        attachments: [{
            type: {
                type: String,
                enum: ["image", "file", "link"],
            },
            url: String,
            name: String,
            size: Number,
        }],
        readBy: [{
            userId: Schema.Types.ObjectId,
            readAt: Date,
        }],
        isSystem: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
