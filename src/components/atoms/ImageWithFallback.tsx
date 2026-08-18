"use client";

import { useState, ImgHTMLAttributes } from "react";
import { cdnImage, cdnSrcSet } from "@/lib/imageCdn";

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
    /**
     * Roughly how wide this renders, so Cloudinary can send an appropriately
     * sized file. Card thumbnails were downloading full-size originals.
     */
    cdnWidth?: number;
    /** Widths offered in the srcset. Set to [] to opt out. */
    cdnWidths?: number[];
}

export const ImageWithFallback = ({
    src,
    fallbackSrc = "/placeholder.png",
    alt,
    className,
    cdnWidth = 800,
    cdnWidths = [320, 480, 768, 1024],
    loading = "lazy",
    decoding = "async",
    sizes,
    ...props
}: ImageWithFallbackProps) => {
    // If src is empty/undefined, skip straight to fallback —
    // browsers don't fire onError for empty string src, causing alt text to show
    const isValidSrc = typeof src === "string" && src.trim() !== "";
    const [imgSrc, setImgSrc] = useState(isValidSrc ? src : fallbackSrc);
    const [errored, setErrored] = useState(false);

    const resolved = errored ? fallbackSrc : imgSrc;
    // Non-Cloudinary sources pass through untouched, so this is safe for local
    // files, unsplash and generated avatars alike.
    const optimised = cdnImage(resolved, { width: cdnWidth });
    const srcSet = cdnWidths.length ? cdnSrcSet(resolved, cdnWidths) : "";

    return (
        <img
            src={optimised}
            srcSet={srcSet || undefined}
            sizes={srcSet ? sizes || "(max-width: 768px) 100vw, 33vw" : undefined}
            alt={alt}
            loading={loading}
            decoding={decoding}
            onError={() => {
                if (!errored) {
                    setErrored(true);
                    setImgSrc(fallbackSrc);
                }
            }}
            className={className}
            {...props}
        />
    );
};
