/**
 * Cloudinary delivery transforms.
 *
 * The catalogue was served straight from Cloudinary with no transformation, so
 * a card thumbnail rendering at ~180px downloaded the full-size original - one
 * product image measured 499 KB as JPEG, and /marketplace shipped 2.1 MB of
 * images on a phone.
 *
 * Cloudinary can resize and pick a modern format at delivery time from the URL
 * alone. The same image with f_auto,q_auto,w_400 comes back as a 47 KB WebP -
 * a 90.7% reduction, with no re-upload and no new infrastructure.
 *
 * Kept separate from lib/cloudinary.ts, which is the server-side upload SDK and
 * pulls in Node APIs; this file is safe to import from client components.
 */

const UPLOAD_SEGMENT = "/image/upload/";

/**
 * Inserts delivery transforms into a Cloudinary URL.
 *
 * Anything that is not a Cloudinary upload URL comes back untouched, so this is
 * safe to apply blindly across a mixed list of sources - local files, unsplash,
 * ui-avatars, or a URL that already carries transforms.
 */
export function cdnImage(
    src: string | undefined | null,
    opts: { width?: number; quality?: string } = {}
): string {
    if (!src || typeof src !== "string") return src || "";
    if (!src.includes("res.cloudinary.com") || !src.includes(UPLOAD_SEGMENT)) return src;

    const [prefix, rest] = src.split(UPLOAD_SEGMENT);
    if (!rest) return src;

    // Already carries a transform segment - leave it alone.
    if (/^[a-z]_[^/]+\//.test(rest)) return src;

    const parts = [
        "f_auto",                       // WebP/AVIF where the browser supports it
        `q_${opts.quality || "auto"}`,  // perceptual quality rather than fixed compression
        opts.width ? `w_${opts.width}` : null,
        opts.width ? "c_limit" : null,  // never upscale beyond the original
    ].filter(Boolean);

    return `${prefix}${UPLOAD_SEGMENT}${parts.join(",")}/${rest}`;
}

/**
 * A srcset so a phone never downloads a desktop-sized file. Returns an empty
 * string for non-Cloudinary sources; React omits an empty attribute.
 */
export function cdnSrcSet(
    src: string | undefined | null,
    widths: number[] = [320, 480, 768, 1024]
): string {
    if (!src || typeof src !== "string" || !src.includes("res.cloudinary.com")) return "";
    return widths.map((w) => `${cdnImage(src, { width: w })} ${w}w`).join(", ");
}
