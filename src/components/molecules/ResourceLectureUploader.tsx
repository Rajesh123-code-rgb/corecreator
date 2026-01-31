"use client";

import * as React from "react";
import { Upload, X, CheckCircle, AlertCircle, File, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/atoms";

interface ResourceFile {
    url: string;
    type: string;
    name: string;
    size?: number;
}

interface ResourceLectureUploaderProps {
    onUploadComplete: (files: ResourceFile[]) => void;
    existingFiles?: ResourceFile[];
    className?: string;
}

export function ResourceLectureUploader({
    onUploadComplete,
    existingFiles = [],
    className = "",
}: ResourceLectureUploaderProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [files, setFiles] = React.useState<ResourceFile[]>(existingFiles);
    const [uploadProgress, setUploadProgress] = React.useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const acceptedFormats = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const maxSizeMB = 10;

    const validateFile = (file: File): string | null => {
        if (!acceptedFormats.includes(file.type)) {
            return "Please upload PDF or image files (JPEG, PNG, WebP)";
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File size must be less than ${maxSizeMB}MB`;
        }
        return null;
    };

    const uploadFiles = async (filesToUpload: FileList) => {
        const validationErrors: string[] = [];
        const newFiles: ResourceFile[] = [];

        setUploadStatus("uploading");
        setErrorMessage("");

        const totalFiles = filesToUpload.length;
        let uploadedCount = 0;

        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const validationError = validateFile(file);

            if (validationError) {
                validationErrors.push(`${file.name}: ${validationError}`);
                continue;
            }

            try {
                setUploadProgress(`Uploading ${i + 1} of ${totalFiles}: ${file.name}`);

                // Upload to Cloudinary via our API
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", "course-resources");

                const response = await fetch("/api/upload/image", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Upload failed");
                }

                const result = await response.json();

                newFiles.push({
                    url: result.url,
                    type: file.type.split("/")[1],
                    name: file.name,
                    size: file.size,
                });

                uploadedCount++;
            } catch (error: any) {
                console.error("Upload error:", error);
                validationErrors.push(`${file.name}: ${error.message || "Failed to upload"}`);
            }
        }

        setUploadProgress("");

        if (validationErrors.length > 0 && uploadedCount === 0) {
            setErrorMessage(validationErrors.join("\n"));
            setUploadStatus("error");
            return;
        }

        if (newFiles.length > 0) {
            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onUploadComplete(updatedFiles);
        }

        if (validationErrors.length > 0) {
            setErrorMessage(`Some files failed:\n${validationErrors.join("\n")}`);
        }

        setUploadStatus(newFiles.length > 0 ? "success" : "error");
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            uploadFiles(selectedFiles);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            uploadFiles(droppedFiles);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemoveFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onUploadComplete(updatedFiles);
    };

    const getFileIcon = (type: string) => {
        if (type === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
        if (["jpeg", "jpg", "png", "webp"].includes(type)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
        return <File className="w-5 h-5 text-gray-500" />;
    };

    const formatFilesize = (bytes?: number) => {
        if (!bytes) return "Unknown size";
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(2)} MB`;
    };

    return (
        <div className={className}>
            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2 mb-4">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-white"
                        >
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    {file.type.toUpperCase()} • {formatFilesize(file.size)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleRemoveFile(index)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => uploadStatus !== "uploading" && fileInputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isDragging
                        ? "border-[var(--secondary-500)] bg-[var(--secondary-50)]"
                        : "border-[var(--border)] hover:border-[var(--secondary-300)] hover:bg-[var(--muted)]"
                    }
                    ${uploadStatus === "error" ? "border-red-300 bg-red-50" : ""}
                    ${uploadStatus === "uploading" ? "pointer-events-none opacity-50" : ""}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                />

                {uploadStatus === "error" ? (
                    <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-red-600 whitespace-pre-line">{errorMessage}</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadStatus("idle");
                                    setErrorMessage("");
                                }}
                                className="mt-2"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto bg-[var(--muted)] rounded-full flex items-center justify-center">
                            <Upload className="w-6 h-6 text-[var(--muted-foreground)]" />
                        </div>
                        <div>
                            <p className="font-medium">Click to upload or drag and drop</p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                PDF or images (max {maxSizeMB}MB per file)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
