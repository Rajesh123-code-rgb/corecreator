import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET: Test Cloudinary configuration (no auth needed — useful for health check)
export async function GET() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const configured = !!(cloudName && apiKey && apiSecret);

    return NextResponse.json({
        configured,
        cloudName: cloudName || "NOT SET",
        apiKey: apiKey ? `${apiKey.substring(0, 6)}...` : "NOT SET",
        apiSecret: apiSecret ? "SET (hidden)" : "NOT SET",
    });
}

export async function POST(request: NextRequest) {
    try {
        // Check Cloudinary config upfront — fail fast with a clear message
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error("[Upload] Cloudinary environment variables not configured");
            return NextResponse.json({
                error: "Image upload service not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
            }, { status: 503 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "products";

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

        // Generate unique public_id
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
            url: result.url,           // Cloudinary secure_url — ready to store in DB
            publicId: result.publicId,
            format: result.format,
            size: result.size,
        });
    } catch (error: any) {
        console.error("[Upload] Image upload error:", error.message, error);
        return NextResponse.json({
            error: error.message || "Failed to upload image"
        }, { status: 500 });
    }
}
