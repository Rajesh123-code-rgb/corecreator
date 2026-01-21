import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
    _id: mongoose.Types.ObjectId;
    key: string;

    // General Settings
    general?: {
        siteName: string;
        siteDescription: string;
        defaultCurrency: string;
        timezone: string;
        supportEmail: string;
    };

    // Commission & Payout Settings
    commission?: {
        platformCommission: number;      // Platform fee percentage (e.g., 12%)
        paymentProcessingFee: number;    // Payment gateway fee (e.g., 2.9%)
        minimumPayoutAmount: number;     // Minimum balance for payout
        payoutSchedule: "weekly" | "biweekly" | "monthly" | "manual";
        payoutHoldDays: number;          // Days to hold funds before payout
    };

    // Payment Gateway Settings
    payments?: {
        razorpay: {
            enabled: boolean;
            testMode: boolean;
            keyId: string;
            keySecret: string;
            webhookSecret: string;
        };
        stripe: {
            enabled: boolean;
            testMode: boolean;
            publishableKey: string;
            secretKey: string;
            webhookSecret: string;
        };
    };

    // Email Settings
    email?: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        encryption: "tls" | "ssl" | "none";
        fromEmail: string;
        fromName: string;
    };

    // Security Settings
    security?: {
        require2FAForAdmins: boolean;
        loginRateLimiting: boolean;
        contentModeration: boolean;
        sessionTimeout: number; // minutes
    };

    // Notification Settings
    notifications?: {
        emailOnNewOrder: boolean;
        emailOnNewUser: boolean;
        emailOnPayout: boolean;
    };

    updatedAt: Date;
    updatedBy?: mongoose.Types.ObjectId;
}

const SettingsSchema = new Schema<ISettings>(
    {
        key: { type: String, required: true, unique: true, default: "platform" },

        general: {
            siteName: { type: String, default: "Core Creator" },
            siteDescription: { type: String, default: "Creative marketplace for artists and learners" },
            defaultCurrency: { type: String, default: "INR" },
            timezone: { type: String, default: "Asia/Kolkata" },
            supportEmail: { type: String, default: "support@corecreator.com" },
        },

        commission: {
            platformCommission: { type: Number, default: 12 },
            paymentProcessingFee: { type: Number, default: 2.9 },
            minimumPayoutAmount: { type: Number, default: 500 },
            payoutSchedule: { type: String, enum: ["weekly", "biweekly", "monthly", "manual"], default: "weekly" },
            payoutHoldDays: { type: Number, default: 7 },
        },

        payments: {
            razorpay: {
                enabled: { type: Boolean, default: true },
                testMode: { type: Boolean, default: true },
                keyId: { type: String, default: "" },
                keySecret: { type: String, default: "" },
                webhookSecret: { type: String, default: "" },
            },
            stripe: {
                enabled: { type: Boolean, default: false },
                testMode: { type: Boolean, default: true },
                publishableKey: { type: String, default: "" },
                secretKey: { type: String, default: "" },
                webhookSecret: { type: String, default: "" },
            },
        },

        email: {
            smtpHost: { type: String, default: "" },
            smtpPort: { type: Number, default: 587 },
            smtpUser: { type: String, default: "" },
            smtpPassword: { type: String, default: "" },
            encryption: { type: String, enum: ["tls", "ssl", "none"], default: "tls" },
            fromEmail: { type: String, default: "" },
            fromName: { type: String, default: "Core Creator" },
        },

        security: {
            require2FAForAdmins: { type: Boolean, default: true },
            loginRateLimiting: { type: Boolean, default: true },
            contentModeration: { type: Boolean, default: false },
            sessionTimeout: { type: Number, default: 60 },
        },

        notifications: {
            emailOnNewOrder: { type: Boolean, default: true },
            emailOnNewUser: { type: Boolean, default: true },
            emailOnPayout: { type: Boolean, default: true },
        },

        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Export the model
const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;

// Helper function to get platform settings (cached)
let cachedSettings: ISettings | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getPlatformSettings(): Promise<ISettings> {
    const now = Date.now();

    if (cachedSettings && (now - cacheTime) < CACHE_DURATION) {
        return cachedSettings;
    }

    let settings = await Settings.findOne({ key: "platform" });

    if (!settings) {
        settings = await Settings.create({ key: "platform" });
    }

    cachedSettings = settings;
    cacheTime = now;

    return settings;
}

// Helper to get commission rates
export async function getCommissionRates(): Promise<{
    platformCommission: number;
    paymentProcessingFee: number;
    studioShare: number;
}> {
    const settings = await getPlatformSettings();
    const platformCommission = settings.commission?.platformCommission || 12;
    const paymentProcessingFee = settings.commission?.paymentProcessingFee || 2.9;
    const studioShare = 100 - platformCommission - paymentProcessingFee;

    return {
        platformCommission,
        paymentProcessingFee,
        studioShare,
    };
}

// Invalidate cache when settings are updated
export function invalidateSettingsCache() {
    cachedSettings = null;
    cacheTime = 0;
}
