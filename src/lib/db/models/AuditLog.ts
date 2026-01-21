import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    action: string;
    resource: string;
    resourceId?: mongoose.Types.ObjectId;
    description: string;

    // Before and after states
    changes?: {
        field: string;
        oldValue: unknown;
        newValue: unknown;
    }[];

    // Request metadata
    ipAddress?: string;
    userAgent?: string;

    // Severity
    severity: "info" | "warning" | "critical";

    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        action: { type: String, required: true, index: true },
        resource: { type: String, required: true, index: true },
        resourceId: { type: Schema.Types.ObjectId },
        description: { type: String, required: true },
        changes: [{
            field: String,
            oldValue: Schema.Types.Mixed,
            newValue: Schema.Types.Mixed,
        }],
        ipAddress: { type: String },
        userAgent: { type: String },
        severity: {
            type: String,
            enum: ["info", "warning", "critical"],
            default: "info",
        },
    },
    { timestamps: true }
);

// Indexes for efficient querying
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });

// TTL index to auto-delete logs older than 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;

import connectDB from "@/lib/db/mongodb";

// Helper function to create audit log
export async function logAudit({
    userId,
    action,
    resource,
    resourceId,
    description,
    changes,
    ipAddress,
    userAgent,
    severity = "info",
}: {
    userId: string | mongoose.Types.ObjectId;
    action: string;
    resource: string;
    resourceId?: string | mongoose.Types.ObjectId;
    description: string;
    changes?: IAuditLog["changes"];
    ipAddress?: string;
    userAgent?: string;
    severity?: "info" | "warning" | "critical";
}): Promise<IAuditLog | null> {
    try {
        await connectDB();

        // Ensure User model is loaded mainly for references if needed, though ObjectId is sufficient for storage
        // const User = mongoose.models.User || mongoose.model("User");

        const logEntry = await AuditLog.create({
            userId: new mongoose.Types.ObjectId(userId.toString()),
            action,
            resource,
            resourceId: resourceId ? new mongoose.Types.ObjectId(resourceId.toString()) : undefined,
            description,
            changes,
            ipAddress,
            userAgent,
            severity,
        });

        return logEntry;
    } catch (error) {
        console.error("Audit Log Creation Failed:", error);
        // Fail silently to avoid breaking the main app flow, but log strictly
        try {
            const fs = require('fs');
            // fs.appendFileSync('audit-debug-error.log', `[${new Date().toISOString()}] Failed to log audit: ${error}\n`);
        } catch (e) { }
        return null;
    }
}
