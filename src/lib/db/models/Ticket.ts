import mongoose, { Schema, Document, Model } from "mongoose";

export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "order" | "payment" | "refund" | "product" | "account" | "technical" | "other";

export interface ITicketReply {
    userId: mongoose.Types.ObjectId;
    message: string;
    attachments?: { url: string; name: string }[];
    isStaff: boolean;
    createdAt: Date;
}

export interface ITicket extends Document {
    _id: mongoose.Types.ObjectId;
    ticketNumber: string;
    userId: mongoose.Types.ObjectId;

    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;

    // Related entities
    relatedTo?: {
        type: "order" | "product" | "payout";
        id: mongoose.Types.ObjectId;
    };

    // Assignment
    assignedTo?: mongoose.Types.ObjectId;

    // Replies
    replies: ITicketReply[];

    // Timestamps
    resolvedAt?: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TicketReplySchema = new Schema<ITicketReply>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true, maxlength: 5000 },
        attachments: [{
            url: String,
            name: String,
        }],
        isStaff: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const TicketSchema = new Schema<ITicket>(
    {
        ticketNumber: { type: String, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        subject: { type: String, required: true, maxlength: 200 },
        description: { type: String, required: true, maxlength: 5000 },
        category: {
            type: String,
            enum: ["order", "payment", "refund", "product", "account", "technical", "other"],
            default: "other",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "waiting_customer", "resolved", "closed"],
            default: "open",
            index: true,
        },
        relatedTo: {
            type: { type: String, enum: ["order", "product", "payout"] },
            id: Schema.Types.ObjectId,
        },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
        replies: [TicketReplySchema],
        resolvedAt: Date,
        closedAt: Date,
    },
    { timestamps: true }
);

// Indexes
TicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
TicketSchema.index({ assignedTo: 1, status: 1 });

// Generate ticket number before saving
TicketSchema.pre("save", async function () {
    if (this.isNew && !this.ticketNumber) {
        try {
            const count = await mongoose.model("Ticket").countDocuments();
            this.ticketNumber = `TKT-${String(count + 1).padStart(6, "0")}`;
        } catch (error) {
            console.error("Error generating ticket number:", error);
            this.ticketNumber = `TKT-${Date.now()}`;
        }
    }
});

const Ticket: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
