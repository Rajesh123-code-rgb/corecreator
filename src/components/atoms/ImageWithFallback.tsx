"use client";

import { useState, ImgHTMLAttributes } from "react";

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
    fallbackSrc?: string;
}

export const ImageWithFallback = ({
    src,
    fallbackSrc = "/placeholder.png",
    alt,
    className,
    ...props
}: ImageWithFallbackProps) => {
    // If src is empty/undefined, skip straight to fallback —
    // browsers don't fire onError for empty string src, causing alt text to show
    const isValidSrc = typeof src === "string" && src.trim() !== "";
    const [imgSrc, setImgSrc] = useState(isValidSrc ? src : fallbackSrc);
    const [errored, setErrored] = useState(false);

    return (
        <img
            src={errored ? fallbackSrc : imgSrc}
            alt={alt}
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
