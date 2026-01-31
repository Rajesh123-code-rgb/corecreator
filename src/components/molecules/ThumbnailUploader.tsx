"use client";

import * as React from "react";
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms";


interface ThumbnailUploaderProps {
    onUploadComplete: (imageData: { url: string; filename: string }) => void;
    existingImage?: { url: string; filename: string };
    className?: string;
    variant?: "default" | "avatar";
    folder?: string; // Cloudinary folder: "workshops", "courses", "avatars", etc.
}

export function ThumbnailUploader({
    onUploadComplete,
    existingImage,
    className = "",
    variant = "default",
    folder = "thumbnails",
}: ThumbnailUploaderProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [imagePreview, setImagePreview] = React.useState<string | null>(existingImage?.url || null);
    const [imageData, setImageData] = React.useState<{ url: string; filename: string } | null>(
        existingImage || null
    );
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const acceptedFormats = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeMB = 10;

    const validateFile = (file: File): string | null => {
        if (!acceptedFormats.includes(file.type)) {
            return "Please upload a valid image file (JPEG, PNG, or WebP)";
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File size must be less than ${maxSizeMB}MB`;
        }
        return null;
    };

    const uploadFile = async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setErrorMessage(validationError);
            setUploadStatus("error");
            return;
        }

        setUploadStatus("uploading");
        setErrorMessage("");

        // Show local preview immediately while uploading
        const localPreview = URL.createObjectURL(file);
        setImagePreview(localPreview);

        try {
            // Upload to Cloudinary via our API
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const response = await fetch("/api/upload/image", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const result = await response.json();

            const data = {
                url: result.url, // Cloudinary CDN URL
                filename: file.name,
            };

            // Update preview with actual Cloudinary URL
            setImagePreview(result.url);
            setImageData(data);
            setUploadStatus("success");
            onUploadComplete(data);

            // Revoke local blob URL
            URL.revokeObjectURL(localPreview);
        } catch (error: any) {
            console.error("Upload error:", error);
            setErrorMessage(error.message || "Failed to upload image");
            setUploadStatus("error");
            setImagePreview(null);
            URL.revokeObjectURL(localPreview);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            uploadFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = () => {
        setImagePreview(null);
        setImageData(null);
        setUploadStatus("idle");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className={className}>
            {imagePreview && uploadStatus !== "error" ? (
                // Image Preview
                <div className={`relative border border-[var(--border)] overflow-hidden group ${variant === "avatar" ? "rounded-full w-full h-full aspect-square" : "rounded-xl w-full h-full"
                    }`}>
                    <img
                        src={imagePreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleRemove}
                            className="scale-90"
                        >
                            <X className="w-4 h-4 mr-1" /> Replace
                        </Button>
                    </div>
                </div>
            ) : (
                // Upload Area
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => uploadStatus !== "uploading" && fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden
                        ${variant === "avatar"
                            ? "rounded-full aspect-square p-4 bg-gray-50 hover:bg-gray-100 border-gray-200"
                            : "rounded-xl p-8 bg-[var(--muted)] hover:bg-[var(--muted)]/80 border-[var(--border)]"
                        }
                        ${isDragging
                            ? "border-[var(--secondary-500)] bg-[var(--secondary-50)]"
                            : "hover:border-[var(--secondary-300)]"
                        }
                        ${uploadStatus === "error" ? "border-red-300 bg-red-50" : ""}
                        ${uploadStatus === "uploading" ? "pointer-events-none opacity-50" : ""}
                        h-full w-full
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {uploadStatus === "error" ? (
                        <div className="space-y-2 p-2 relative z-10 w-full">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                            <p className="text-xs font-medium text-red-600 truncate px-2">{errorMessage}</p>
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setUploadStatus("idle"); }} className="h-6 w-6 absolute top-0 right-0">
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {variant === "avatar" ? (
                                <>
                                    <ImageIcon className="w-6 h-6 text-[var(--muted-foreground)] mx-auto" />
                                    <span className="text-xs font-medium text-[var(--muted-foreground)]">Upload</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 mx-auto bg-white/50 rounded-full flex items-center justify-center mb-2">
                                        <Upload className="w-6 h-6 text-[var(--muted-foreground)]" />
                                    </div>
                                    <p className="text-sm font-medium">Click or Drag to Upload</p>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        Max {maxSizeMB}MB
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
