import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    email: string;
    password?: string;
    name: string;
    avatar?: string;
    bio?: string;
    role: "user" | "studio" | "admin";
    adminRole?: "super" | "operations" | "content" | "seo" | "finance" | "support";
    permissions: string[];
    isVerified: boolean;
    isActive: boolean;

    // KYC Details
    kyc: {
        status: "pending" | "approved" | "rejected" | "not_submitted";
        submittedAt?: Date;
        verifiedAt?: Date;
        documents: {
            type: string; // e.g., "id_proof", "address_proof"
            url: string;
            verified: boolean;
        }[];
        rejectionReason?: string;
    };

    // Social accounts
    accounts: {
        provider: string;
        providerAccountId: string;
    }[];

    // Profile details
    profile: {
        phone?: string;
        location?: string;
        website?: string;
        socialLinks?: {
            instagram?: string;
            twitter?: string;
            facebook?: string;
            youtube?: string;
            linkedin?: string;
        };
    };

    // Studio Profile (Replaces artist/instructor profiles)
    studioProfile?: {
        name?: string; // Studio name
        description?: string;
        coverImage?: string;
        specializations?: string[];
        yearsOfExperience?: number;
        qualifications?: string[];
        // Stats
        rating?: number;
        totalReviews?: number;
        totalStudents?: number;
        totalSales?: number;
    };

    /** @deprecated - Migrated to studioProfile */
    artistProfile?: {
        portfolio?: string[];
        specializations?: string[];
        yearsOfExperience?: number;
        artStyles?: string[];
        exhibitions?: string[];
    };

    /** @deprecated - Migrated to studioProfile */
    instructorProfile?: {
        qualifications?: string[];
        teachingExperience?: number;
        coursesCreated?: number;
        totalStudents?: number;
        averageRating?: number;
    };

    // Preferences
    preferences: {
        language: string;
        currency: string;
        theme: "light" | "dark" | "system";
        emailNotifications: boolean;
        pushNotifications: boolean;
    };

    // Security
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;

    // Wishlist
    wishlist: {
        itemId: mongoose.Types.ObjectId;
        itemType: "course" | "product"; // Restricting to known types
        addedAt: Date;
    }[];

    // Addresses
    addresses: {
        _id: mongoose.Types.ObjectId;
        type: "home" | "work" | "billing" | "shipping";
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
    }[];

    // Payout Methods
    payoutMethods: {
        _id?: mongoose.Types.ObjectId;
        type: "bank_account" | "upi";
        details: {
            accountNumber?: string;
            ifsc?: string;
            accountHolderName?: string;
            bankName?: string;
            upiId?: string;
        };
        isDefault: boolean;
    }[];

    // Timestamps
    lastLoginAt?: Date;
    emailVerifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        // ... previous fields
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false, // Don't return password by default
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        avatar: String,
        bio: {
            type: String,
            maxlength: 500,
        },
        role: {
            type: String,
            enum: ["user", "studio", "admin"],
            default: "user",
        },
        // RBAC Fields
        adminRole: {
            type: String,
            enum: ["super", "operations", "content", "seo", "finance", "support"],
        },
        permissions: [String],
        isVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        kyc: {
            status: {
                type: String,
                enum: ["pending", "approved", "rejected", "not_submitted"],
                default: "not_submitted",
            },
            submittedAt: Date,
            verifiedAt: Date,
            documents: [{
                type: { type: String, required: true },
                url: { type: String, required: true },
                verified: { type: Boolean, default: false }
            }],
            rejectionReason: String,
        },
        accounts: [
            {
                provider: String,
                providerAccountId: String,
            },
        ],
        profile: {
            phone: String,
            location: String,
            website: String,
            socialLinks: {
                instagram: String,
                twitter: String,
                facebook: String,
                youtube: String,
                linkedin: String,
            },
        },
        studioProfile: {
            name: String,
            description: String,
            coverImage: String,
            specializations: [String],
            yearsOfExperience: Number,
            qualifications: [String],
            rating: { type: Number, default: 0 },
            totalReviews: { type: Number, default: 0 },
            totalStudents: { type: Number, default: 0 },
            totalSales: { type: Number, default: 0 },
        },
        // Legacy fields kept for data safety during migration
        artistProfile: {
            portfolio: [String],
            specializations: [String],
            yearsOfExperience: Number,
            artStyles: [String],
            exhibitions: [String],
        },
        instructorProfile: {
            qualifications: [String],
            teachingExperience: Number,
            coursesCreated: Number,
            totalStudents: Number,
            averageRating: Number,
        },
        preferences: {
            language: { type: String, default: "en" },
            currency: { type: String, default: "INR" },
            theme: { type: String, default: "system" },
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: String,
        lastLoginAt: Date,
        emailVerifiedAt: Date,
        wishlist: [
            {
                itemId: { type: Schema.Types.ObjectId, required: true },
                itemType: { type: String, enum: ["course", "product", "workshop"], required: true },
                addedAt: { type: Date, default: Date.now },
            },
        ],
        addresses: [
            {
                type: { type: String, enum: ["home", "work", "billing", "shipping"], default: "home" },
                street: String,
                city: String,
                state: String,
                zipCode: String,
                country: String,
                isDefault: { type: Boolean, default: false },
            },
        ],
        payoutMethods: [
            {
                type: { type: String, enum: ["bank_account", "upi"], required: true },
                details: {
                    accountNumber: String,
                    ifsc: String,
                    accountHolderName: String,
                    bankName: String,
                    upiId: String,
                },
                isDefault: { type: Boolean, default: false },
            }
        ],
    },
    {
        timestamps: true,
    }
);

// Add index for role querying
UserSchema.index({ role: 1 });
UserSchema.index({ "studioProfile.specializations": 1 });

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
// Force HMR reload
