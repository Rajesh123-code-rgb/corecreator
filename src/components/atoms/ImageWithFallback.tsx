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
    const [imgSrc, setImgSrc] = useState(src);
    const [errored, setErrored] = useState(false);

    return (
        <img
            src={errored ? fallbackSrc : imgSrc}
            alt={alt}
            onError={() => {
                setErrored(true);
            }}
            className={className}
            {...props}
        />
    );
};
