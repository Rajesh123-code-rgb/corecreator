import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Category from "@/lib/db/models/Category";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { generateWithOpenAI, artFormImagePrompt } from "@/lib/ai/imageGeneration";
import { ART_FORMS, courseSlug } from "@/lib/artForms";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";

/**
 * Fills in category images that are missing.
 *
 * Works in small batches on purpose. Generating all 48 art forms takes eight to
 * sixteen minutes end to end, far longer than any request should be held open,
 * so this does a few and reports what is left. The caller loops. Because the
 * only rows it touches are ones with no image, pressing the button again after
 * an interruption simply carries on.
 *
 * Nothing is ever overwritten. An image an admin uploaded by hand, or one
 * generated earlier, is left exactly as it is.
 */

export const maxDuration = 300;

/** Both the product row and its course twin get the same image. */
async function storeImage(slug: string, url: string) {
    await Category.updateOne({ slug }, { $set: { image: url } });
    await Category.updateOne({ slug: courseSlug(slug) }, { $set: { image: url } });
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_CATEGORIES)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY is not configured on this server" },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const limit = Math.min(Math.max(Number(body?.limit) || 5, 1), 10);

        await connectDB();

        // Which art-form product categories still have no image.
        const slugs = ART_FORMS.map((f) => f.slug);
        const rows = await Category.find(
            { slug: { $in: slugs }, type: "product" },
            { slug: 1, image: 1 }
        ).lean();

        const hasImage = new Set(
            rows.filter((r) => typeof r.image === "string" && r.image.trim() !== "").map((r) => r.slug)
        );
        const pending = ART_FORMS.filter((f) => !hasImage.has(f.slug));
        const batch = pending.slice(0, limit);

        const generated: string[] = [];
        const failed: string[] = [];

        for (const form of batch) {
            try {
                const buffer = await generateWithOpenAI(artFormImagePrompt(form.name, form.description));
                if (!buffer) {
                    // Left without an image on purpose. The home page falls back
                    // to a text-only card, which is better than storing a
                    // generic placeholder that misrepresents the craft.
                    failed.push(form.name);
                    continue;
                }

                const result = await uploadToCloudinary(buffer, {
                    folder: "corecreator/categories/ai-generated",
                    publicId: `category_${form.slug}_${Date.now()}`,
                    resourceType: "image",
                });

                await storeImage(form.slug, result.url);
                generated.push(form.name);
            } catch (err) {
                console.error(`[categories] image for ${form.slug}:`, (err as Error)?.message || err);
                failed.push(form.name);
            }
        }

        return NextResponse.json({
            generated: generated.length,
            names: generated,
            failed,
            // Failures are not counted as done, so the caller would ask for them
            // again forever. Excluding them from `remaining` ends the loop; the
            // admin can press the button again later to retry.
            remaining: Math.max(pending.length - batch.length, 0),
            total: ART_FORMS.length,
        });
    } catch (error) {
        console.error("[categories] generate-images:", error);
        return NextResponse.json({ error: "Failed to generate category images" }, { status: 500 });
    }
}
