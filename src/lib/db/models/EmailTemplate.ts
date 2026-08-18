import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * An admin-editable override for one of the transactional emails.
 *
 * The defaults live in code (src/lib/email/templates.ts) so a fresh install
 * always has working email. A row here overrides the default for that key;
 * deleting the row reverts to the shipped version, which means a bad edit is
 * never unrecoverable.
 */
export interface IEmailTemplate extends Document {
    key: string;
    subject: string;
    htmlContent: string;
    isActive: boolean;
    updatedBy?: mongoose.Types.ObjectId;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
    {
        key: { type: String, required: true, unique: true, index: true },
        subject: { type: String, required: true },
        htmlContent: { type: String, required: true },
        // Lets an admin park an edit without deleting it; when false the shipped
        // default is used.
        isActive: { type: Boolean, default: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

const EmailTemplate: Model<IEmailTemplate> =
    mongoose.models.EmailTemplate ||
    mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);

export default EmailTemplate;
