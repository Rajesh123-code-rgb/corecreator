import mongoose, { Schema, Document, Model } from "mongoose";

// Sub-schemas for complex structures
const variantSchema = new Schema({
    id: { type: String, required: true },
    attributes: [{
        name: { type: String, required: true }, // e.g. "Size", "Color"
        value: { type: String, required: true } // e.g. "A4", "Oak"
    }],
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    sku: { type: String },
    imageIndex: { type: Number } // Index of the specific image in the main images array
}, { _id: false });

const customizationSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true }, // e.g. "Enter Name", "Upload Photo"
    type: { type: String, enum: ["text", "image", "color", "select"], required: true },
    required: { type: Boolean, default: false },
    priceModifier: { type: Number, default: 0 },
    options: [String], // For select/color types
    maxLength: { type: Number }
}, { _id: false });

const addOnSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true }, // e.g. "Gift Wrap", "Rush Order"
    price: { type: Number, required: true },
    description: { type: String },
    active: { type: Boolean, default: true }
}, { _id: false });

export interface IProduct extends Document {
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;

    // Type
    productType: "physical" | "digital" | "service";

    // Pricing
    price: number; // Base price
    compareAtPrice?: number;
    currency: string;

    // Categorization
    category: string;
    subcategory?: string;
    tags: string[];

    // Media
    images: {
        url: string;
        alt?: string;
        isPrimary: boolean;
    }[];
    videoUrl?: string; // Promo/process video

    // Inventory & Variants
    sku?: string; // Base SKU
    quantity: number; // Global stock if no variants
    trackInventory: boolean;
    lowStockThreshold?: number;
    hasVariants: boolean;
    variants: {
        id: string;
        attributes: { name: string; value: string }[];
        price: number;
        stock: number;
        sku?: string;
        imageIndex?: number;
    }[];

    // Personalization & Add-ons
    customizations: {
        id: string;
        label: string;
        type: "text" | "image" | "color" | "select";
        required: boolean;
        priceModifier: number;
        options?: string[];
        maxLength?: number;
    }[];
    addOns: {
        id: string;
        title: string;
        price: number;
        description?: string;
        active: boolean;
    }[];

    // Shipping
    shipping: {
        weight?: number; // in kg
        width?: number; // in cm
        height?: number; // in cm
        depth?: number; // in cm (length)
        requiresShipping: boolean;
        processingTime?: string; // e.g. "1-2 days"
        shippingProfile?: mongoose.Types.ObjectId; // Link to specific profile
    };

    // Instructions & Offers
    careInstructions?: string;
    bulkDiscounts?: {
        quantity: number;
        discountPercentage: number;
    }[];

    // Vendor/Seller info
    seller: mongoose.Types.ObjectId;
    sellerName: string;

    // Artwork specific
    artworkDetails?: {
        medium?: string;
        style?: string;
        subject?: string;
        orientation?: "landscape" | "portrait" | "square";
        yearCreated?: number;
        isOriginal: boolean;
        isFramed: boolean;
    };

    // Status
    status: "draft" | "pending" | "active" | "sold" | "archived" | "rejected";
    isFeatured: boolean;

    // Stats
    views: number;
    favorites: number;
    salesCount: number;

    // Reviews
    rating: number;
    reviewCount: number;

    // SEO
    metaTitle?: string;
    metaDescription?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    submittedAt?: Date;
    reviewedAt?: Date;

    // Approval
    rejectionReason?: string;
}

const productSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, unique: true, lowercase: true }, // Not required - auto-generated
        description: { type: String, required: true },
        shortDescription: { type: String },

        productType: {
            type: String,
            enum: ["physical", "digital", "service"],
            default: "physical"
        },

        price: { type: Number, required: true, min: 0 },
        compareAtPrice: { type: Number, min: 0 },
        currency: { type: String, enum: ["USD", "INR", "EUR", "GBP"], default: "INR" },

        category: { type: String, required: true, index: true },
        subcategory: { type: String, index: true },
        tags: [{ type: String }],

        images: [{
            url: { type: String, required: true },
            alt: { type: String },
            isPrimary: { type: Boolean, default: false },
        }],
        videoUrl: { type: String },

        sku: { type: String, sparse: true },
        quantity: { type: Number, default: 1, min: 0 },
        trackInventory: { type: Boolean, default: true },
        lowStockThreshold: { type: Number, default: 5 },

        hasVariants: { type: Boolean, default: false },
        variants: [variantSchema],

        customizations: [customizationSchema],
        addOns: [addOnSchema],

        careInstructions: { type: String },
        bulkDiscounts: [{
            quantity: { type: Number, required: true, min: 2 },
            discountPercentage: { type: Number, required: true, min: 0, max: 100 }
        }],

        shipping: {
            weight: { type: Number },
            width: { type: Number },
            height: { type: Number },
            depth: { type: Number },
            requiresShipping: { type: Boolean, default: true },
            processingTime: { type: String },
            shippingProfile: { type: Schema.Types.ObjectId, ref: "ShippingProfile" }
        },

        seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        sellerName: { type: String, required: true },

        artworkDetails: {
            medium: { type: String },
            style: { type: String },
            subject: { type: String },
            orientation: { type: String, enum: ["landscape", "portrait", "square"] },
            yearCreated: { type: Number },
            isOriginal: { type: Boolean, default: true },
            isFramed: { type: Boolean, default: false },
        },

        status: {
            type: String,
            enum: ["draft", "pending", "active", "sold", "archived", "rejected"],
            default: "draft",
            index: true,
        },
        isFeatured: { type: Boolean, default: false, index: true },

        views: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        salesCount: { type: Number, default: 0 },

        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },

        metaTitle: { type: String },
        metaDescription: { type: String },

        publishedAt: { type: Date },
        submittedAt: { type: Date },
        reviewedAt: { type: Date },
        rejectionReason: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ rating: -1, reviewCount: -1 });
productSchema.index({ "variants.sku": 1 });

// Generate slug BEFORE validation so it's available when required check happens
productSchema.pre("validate", function () {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            + "-" + Date.now().toString(36);
    }
});

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
