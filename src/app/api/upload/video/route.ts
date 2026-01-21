import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("video") as File;

        if (!file) {
            return NextResponse.json({ error: "No video file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }

        // Validate file size (max 500MB)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum size is 500MB" }, { status: 400 });
        }

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads", "videos");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split(".").pop() || "mp4";
        const filename = `video_${timestamp}_${randomString}.${extension}`;

        // Convert file to buffer and write
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return the public URL
        const url = `/uploads/videos/${filename}`;

        return NextResponse.json({
            success: true,
            url,
            filename: file.name,
            size: file.size,
        });
    } catch (error) {
        console.error("Video upload error:", error);
        return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
    }
}

// Increase body size limit for video uploads

