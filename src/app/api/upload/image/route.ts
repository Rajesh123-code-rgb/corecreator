import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "products"; // products, workshops, courses, etc.

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type - images only
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" }, { status: 400 });
        }

        // Validate file size (max 10MB for images)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const sanitizedFolder = folder.replace(/[^a-z0-9_-]/gi, "").substring(0, 20);
        const publicId = `${session.user.id}_${timestamp}_${randomString}`;

        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, {
            folder: `corecreator/${sanitizedFolder}`,
            publicId,
            resourceType: "image",
        });

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
            format: result.format,
            size: result.size,
        });
    } catch (error) {
        console.error("Image upload error:", error);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
}
