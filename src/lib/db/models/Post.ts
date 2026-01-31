import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImage: string;
    coverImageAltText?: string;
    author: mongoose.Types.ObjectId;
    status: "draft" | "published" | "archived";
    tags: string[];

    // SEO
    metaTitle?: string;
    metaDescription?: string;

    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        excerpt: { type: String },
        content: { type: String, required: true },
        coverImage: { type: String, required: true },
        coverImageAltText: { type: String },
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
            index: true
        },
        tags: [{ type: String }],

        metaTitle: { type: String },
        metaDescription: { type: String },

        publishedAt: { type: Date },
    },
    {
        timestamps: true
    }
);

// Indexes
postSchema.index({ slug: 1 });
postSchema.index({ status: 1 });
postSchema.index({ createdAt: -1 });

// Generate slug
postSchema.pre("save", function () {
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
});

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default Post;
