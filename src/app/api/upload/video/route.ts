import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    createBunnyVideo,
    uploadBunnyVideo,
    getBunnyEmbedUrl,
    getBunnyStreamUrl,
    getBunnyThumbnailUrl
} from "@/lib/bunnystream";

// Maximum file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Allowed video types
const ALLOWED_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-m4v",
];

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if Bunny Stream is configured
        const apiKey = process.env.BUNNY_STREAM_API_KEY;
        const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
        const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;

        if (!apiKey || !libraryId || !cdnHostname) {
            console.error("Bunny Stream not configured, falling back to local storage");
            return handleLocalUpload(request);
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("video") as File;

        if (!file) {
            return NextResponse.json({ error: "No video file provided" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Allowed: MP4, WebM, MOV, AVI"
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: "File too large. Maximum size is 500MB"
            }, { status: 400 });
        }

        // Step 1: Create video entry in Bunny Stream
        const videoTitle = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        const bunnyVideo = await createBunnyVideo({ title: videoTitle });

        // Step 2: Upload the video file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await uploadBunnyVideo(bunnyVideo.videoId, buffer);

        // Step 3: Return URLs
        const embedUrl = getBunnyEmbedUrl(bunnyVideo.videoId);
        const streamUrl = getBunnyStreamUrl(bunnyVideo.videoId);
        const thumbnailUrl = getBunnyThumbnailUrl(bunnyVideo.videoId);

        return NextResponse.json({
            success: true,
            videoId: bunnyVideo.videoId,
            url: embedUrl,           // Embed URL for iframe playback
            streamUrl: streamUrl,    // HLS URL for custom player
            thumbnailUrl: thumbnailUrl,
            filename: file.name,
            size: file.size,
            provider: "bunny",
        });
    } catch (error: any) {
        console.error("Video upload error:", error);
        return NextResponse.json({
            error: error.message || "Failed to upload video"
        }, { status: 500 });
    }
}

/**
 * Fallback to local storage if Bunny Stream is not configured
 */
async function handleLocalUpload(request: NextRequest) {
    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");
    const { existsSync } = await import("fs");

    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
        return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File too large. Maximum size is 500MB" }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "videos");
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "mp4";
    const filename = `video_${timestamp}_${randomString}.${extension}`;

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/videos/${filename}`;

    return NextResponse.json({
        success: true,
        url,
        filename: file.name,
        size: file.size,
        provider: "local",
    });
}
