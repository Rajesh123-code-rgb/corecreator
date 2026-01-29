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
        const type = formData.get("type") as string; // "id_proof" or "address_proof"

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" }, { status: 400 });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const sanitizedType = type?.replace(/[^a-z_]/gi, "") || "document";
        const publicId = `${session.user.id}_${sanitizedType}_${timestamp}_${randomString}`;

        // Determine resource type - PDFs should use 'raw' or 'auto'
        const resourceType = file.type === 'application/pdf' ? 'raw' : 'image';

        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, {
            folder: "corecreator/kyc-documents",
            publicId,
            resourceType: resourceType as 'image' | 'raw',
        });

        return NextResponse.json({
            success: true,
            url: result.url,
            type: sanitizedType,
            filename: file.name,
            size: result.size,
            publicId: result.publicId,
        });
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}

