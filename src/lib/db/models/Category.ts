import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    type: "product" | "course" | "workshop" | "blog";
    description?: string;
    image?: string;
    icon?: string;
    parent?: mongoose.Types.ObjectId;
    order: number;
    isActive: boolean;
    productCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, maxlength: 100 },
        slug: { type: String, required: true, unique: true },
        type: {
            type: String,
            enum: ["product", "course", "workshop", "blog"],
            default: "product",
            index: true,
        },
        description: { type: String, maxlength: 500 },
        image: { type: String },
        icon: { type: String },
        parent: { type: Schema.Types.ObjectId, ref: "Category" },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true, index: true },
        productCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes
CategorySchema.index({ type: 1, isActive: 1, order: 1 });
CategorySchema.index({ parent: 1 });

// Generate slug from name
CategorySchema.pre("save", function () {
    if (this.isModified("name") && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
});

// Delete cached model to ensure fresh registration
if (mongoose.models.Category) {
    delete mongoose.models.Category;
}

const Category: Model<ICategory> = mongoose.model<ICategory>("Category", CategorySchema);

export default Category;

