"use client";

import * as React from "react";
import { Button, Input, Textarea } from "@/components/atoms";
import { X, Image as ImageIcon, Plus, Upload, Loader2 } from "lucide-react";

interface ProjectLectureEditorProps {
    existingContent: {
        instructions?: string;
        expectedOutcome?: string;
        referenceImages?: string[];
    };
    onContentChange: (content: {
        instructions: string;
        expectedOutcome: string;
        referenceImages: string[];
    }) => void;
}

export function ProjectLectureEditor({ existingContent, onContentChange }: ProjectLectureEditorProps) {
    const [instructions, setInstructions] = React.useState(existingContent.instructions || "");
    const [expectedOutcome, setExpectedOutcome] = React.useState(existingContent.expectedOutcome || "");
    const [referenceImages, setReferenceImages] = React.useState<string[]>(existingContent.referenceImages || []);
    const [newImageUrl, setNewImageUrl] = React.useState("");
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        onContentChange({
            instructions,
            expectedOutcome,
            referenceImages
        });
    }, [instructions, expectedOutcome, referenceImages]);

    const addImageByUrl = () => {
        if (newImageUrl) {
            setReferenceImages([...referenceImages, newImageUrl]);
            setNewImageUrl("");
        }
    };

    const uploadImage = async (file: File) => {
        // Validate file
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Please upload an image file (JPEG, PNG, WebP, GIF)");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setUploadError("File size must be less than 10MB");
            return;
        }

        setIsUploading(true);
        setUploadError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "project-references");

            const response = await fetch("/api/upload/image", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const result = await response.json();
            setReferenceImages([...referenceImages, result.url]);
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadError(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadImage(file);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeImage = (index: number) => {
        setReferenceImages(referenceImages.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6 bg-white p-4 rounded-lg border border-gray-100">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Instructions</label>
                <div className="text-xs text-gray-500 mb-2">Provide step-by-step instructions for the student project.</div>
                <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Step 1: Gather your materials..."
                    rows={6}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Outcome</label>
                <div className="text-xs text-gray-500 mb-2">Describe what the student should have achieved by the end.</div>
                <Textarea
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    placeholder="By the end of this project, you will have..."
                    rows={3}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images</label>

                {/* Upload Error */}
                {uploadError && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
                        <span>{uploadError}</span>
                        <button onClick={() => setUploadError("")} className="text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Upload Options */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Upload Button */}
                    <Button

                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Image
                            </>
                        )}
                    </Button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Or use URL */}
                    <div className="flex gap-2 flex-1">
                        <Input
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="Or paste image URL..."
                            className="flex-1"
                        />
                        <Button onClick={addImageByUrl} type="button" variant="outline" disabled={!newImageUrl}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {referenceImages.map((url, index) => (
                        <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={url} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {referenceImages.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <span>No reference images added</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

