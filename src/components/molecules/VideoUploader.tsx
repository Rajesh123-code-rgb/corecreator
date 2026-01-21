"use client";

import * as React from "react";
import { Upload, X, Play, CheckCircle, AlertCircle, Loader2, Youtube, Link } from "lucide-react";
import { Button } from "@/components/atoms";

interface VideoUploaderProps {
    onUploadComplete: (videoData: { url: string; duration: number; filename: string }) => void;
    existingVideo?: { url: string; duration: number; filename: string };
    maxSizeMB?: number;
    className?: string;
}

export function VideoUploader({
    onUploadComplete,
    existingVideo,
    maxSizeMB = 500,
    className = "",
}: VideoUploaderProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">(
        existingVideo ? "success" : "idle"
    );
    const [errorMessage, setErrorMessage] = React.useState("");
    const [videoPreview, setVideoPreview] = React.useState<string | null>(existingVideo?.url || null);
    const [videoData, setVideoData] = React.useState<{ url: string; duration: number; filename: string } | null>(
        existingVideo || null
    );
    const [uploadMethod, setUploadMethod] = React.useState<"file" | "youtube">("file");
    const [youtubeUrl, setYoutubeUrl] = React.useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const acceptedFormats = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

    // Extract YouTube video ID from URL
    const getYouTubeVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const handleYouTubeSubmit = async () => {
        const videoId = getYouTubeVideoId(youtubeUrl);
        if (!videoId) {
            setErrorMessage("Please enter a valid YouTube URL");
            setUploadStatus("error");
            return;
        }

        setUploadStatus("uploading");
        setUploadProgress(50);

        try {
            // Fetch video title using YouTube oEmbed API
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

            let title = `YouTube Video`;

            if (response.ok) {
                const data = await response.json();
                title = data.title || title;
            }

            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const videoData = {
                url: embedUrl,
                duration: 0, // User can manually update this or we can extract it from iframe
                filename: title,
            };

            setVideoData(videoData);
            setVideoPreview(embedUrl);
            setUploadStatus("success");
            setUploadProgress(100);
            onUploadComplete(videoData);
        } catch (error) {
            console.error("Error fetching YouTube data:", error);
            // Still allow the video
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const videoData = {
                url: embedUrl,
                duration: 0,
                filename: `YouTube Video`,
            };
            setVideoData(videoData);
            setVideoPreview(embedUrl);
            setUploadStatus("success");
            onUploadComplete(videoData);
        }
    };

    const validateFile = (file: File): string | null => {
        if (!acceptedFormats.includes(file.type)) {
            return "Please upload a valid video file (MP4, WebM, MOV, or AVI)";
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `File size must be less than ${maxSizeMB}MB`;
        }
        return null;
    };

    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(Math.round(video.duration));
            };
            video.onerror = () => resolve(0);
            video.src = URL.createObjectURL(file);
        });
    };

    const uploadFile = async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setErrorMessage(validationError);
            setUploadStatus("error");
            return;
        }

        setUploadStatus("uploading");
        setUploadProgress(0);
        setErrorMessage("");

        // Get video duration
        const duration = await getVideoDuration(file);

        // Create form data
        const formData = new FormData();
        formData.append("video", file);

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    const data = {
                        url: response.url,
                        duration: duration,
                        filename: response.filename,
                    };
                    setVideoData(data);
                    setVideoPreview(response.url);
                    setUploadStatus("success");
                    onUploadComplete(data);
                } else {
                    setErrorMessage("Upload failed. Please try again.");
                    setUploadStatus("error");
                }
            });

            xhr.addEventListener("error", () => {
                setErrorMessage("Network error. Please check your connection.");
                setUploadStatus("error");
            });

            xhr.open("POST", "/api/upload/video");
            xhr.send(formData);
        } catch {
            setErrorMessage("Upload failed. Please try again.");
            setUploadStatus("error");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleRemove = () => {
        setVideoPreview(null);
        setVideoData(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className={className}>
            {videoPreview && uploadStatus === "success" ? (
                // Video Preview
                <div className="relative border border-[var(--border)] rounded-xl overflow-hidden bg-black">
                    {(videoData?.filename.startsWith("YouTube:") || videoData?.url.includes("youtube.com") || videoData?.url.includes("youtu.be")) ? (
                        <iframe
                            src={videoPreview}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            src={videoPreview}
                            className="w-full aspect-video object-contain"
                            controls
                        />
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/90 hover:bg-white"
                            onClick={handleRemove}
                        >
                            <X className="w-4 h-4 mr-1" /> Replace
                        </Button>
                    </div>
                    {videoData && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex items-center justify-between text-white text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span>{videoData.filename}</span>
                                </div>
                                {videoData.duration > 0 && <span>{formatDuration(videoData.duration)}</span>}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {/* Method Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setUploadMethod("file")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${uploadMethod === "file"
                                ? "border-[var(--secondary-500)] bg-[var(--secondary-50)] text-[var(--secondary-700)]"
                                : "border-[var(--border)] hover:bg-[var(--muted)]"
                                }`}
                        >
                            <Upload className="w-4 h-4" />
                            Upload Video
                        </button>
                        <button
                            onClick={() => setUploadMethod("youtube")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${uploadMethod === "youtube"
                                ? "border-[var(--secondary-500)] bg-[var(--secondary-50)] text-[var(--secondary-700)]"
                                : "border-[var(--border)] hover:bg-[var(--muted)]"
                                }`}
                        >
                            <Youtube className="w-4 h-4" />
                            YouTube Link
                        </button>
                    </div>

                    {uploadMethod === "youtube" ? (
                        // YouTube URL Input
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">YouTube Video URL</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                        <input
                                            type="url"
                                            value={youtubeUrl}
                                            onChange={(e) => {
                                                setYoutubeUrl(e.target.value);
                                                setUploadStatus("idle");
                                                setErrorMessage("");
                                            }}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                        />
                                    </div>
                                    <Button onClick={handleYouTubeSubmit}>
                                        Add Video
                                    </Button>
                                </div>
                                {uploadStatus === "error" && (
                                    <p className="text-sm text-red-600">{errorMessage}</p>
                                )}
                            </div>
                            <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--muted)]/30">
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    <strong>Tip:</strong> Paste any YouTube video URL. We support youtube.com/watch, youtu.be, and youtube.com/embed formats.
                                </p>
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
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                        ${isDragging
                                    ? "border-[var(--secondary-500)] bg-[var(--secondary-50)]"
                                    : "border-[var(--border)] hover:border-[var(--secondary-300)] hover:bg-[var(--muted)]"
                                }
                        ${uploadStatus === "error" ? "border-red-300 bg-red-50" : ""}
                        ${uploadStatus === "uploading" ? "pointer-events-none" : ""}
                    `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {uploadStatus === "uploading" ? (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-[var(--secondary-100)] rounded-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-[var(--secondary-600)] animate-spin" />
                                    </div>
                                    <div>
                                        <p className="font-medium mb-2">Uploading video...</p>
                                        <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--secondary-500)] rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-[var(--muted-foreground)] mt-2">{uploadProgress}%</p>
                                    </div>
                                </div>
                            ) : uploadStatus === "error" ? (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-red-600">{errorMessage}</p>
                                        <p className="text-sm text-[var(--muted-foreground)] mt-2">Click to try again</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-[var(--muted)] rounded-full flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-[var(--muted-foreground)]" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {isDragging ? "Drop your video here" : "Click to upload or drag and drop"}
                                        </p>
                                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                            MP4, WebM, MOV, or AVI (max {maxSizeMB}MB)
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Duration Input for YouTube videos */}
                    {uploadMethod === "youtube" && videoData && videoData.filename.includes("YouTube") && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <label className="block text-sm font-medium mb-2">
                                Video Duration (optional)
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    placeholder="Minutes"
                                    min="0"
                                    className="w-20 px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
                                    onChange={(e) => {
                                        const mins = parseInt(e.target.value) || 0;
                                        const currentSecs = videoData.duration % 60;
                                        const newDuration = (mins * 60) + currentSecs;
                                        const updatedData = { ...videoData, duration: newDuration };
                                        setVideoData(updatedData);
                                        onUploadComplete(updatedData);
                                    }}
                                />
                                <span>:</span>
                                <input
                                    type="number"
                                    placeholder="Seconds"
                                    min="0"
                                    max="59"
                                    className="w-20 px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
                                    onChange={(e) => {
                                        const secs = parseInt(e.target.value) || 0;
                                        const currentMins = Math.floor(videoData.duration / 60);
                                        const newDuration = (currentMins * 60) + secs;
                                        const updatedData = { ...videoData, duration: newDuration };
                                        setVideoData(updatedData);
                                        onUploadComplete(updatedData);
                                    }}
                                />
                                <span className="text-sm text-[var(--muted-foreground)]">(MM:SS)</span>
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                Enter the video duration to display accurate lesson time
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
