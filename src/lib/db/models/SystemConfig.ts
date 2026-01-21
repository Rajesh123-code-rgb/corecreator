import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemConfig extends Document {
    key: string; // e.g., "maintenance_mode", "beta_features", "tax_settings"
    value: any;
    description?: string;
    updatedBy?: string;
    updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        value: {
            type: Schema.Types.Mixed, // Can be boolean, number, object, etc.
            required: true,
        },
        description: String,
        updatedBy: String,
    },
    {
        timestamps: true,
    }
);

const SystemConfig: Model<ISystemConfig> =
    mongoose.models.SystemConfig || mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);

export default SystemConfig;
