import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Allow larger body size for file uploads (up to 10MB)
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Please log in to upload documents" },
                { status: 401 }
            );
        }

        let formData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json(
                { error: "File too large or invalid upload. Please use a file under 5MB." },
                { status: 400 }
            );
        }

        const file = formData.get("file") as File;
        const type = formData.get("type") as string; // "id_proof" or "address_proof"

        if (!file || !(file instanceof File) || file.size === 0) {
            return NextResponse.json(
                { error: "No file provided. Please select a document to upload." },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload a JPEG, PNG, WebP, or PDF file." },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Please upload a file smaller than 5MB." },
                { status: 400 }
            );
        }

        // Convert file to buffer
        let buffer: Buffer;
        try {
            const bytes = await file.arrayBuffer();
            buffer = Buffer.from(bytes);
        } catch {
            return NextResponse.json(
                { error: "Failed to read file. Please try uploading again." },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const sanitizedType = type?.replace(/[^a-z_]/gi, "") || "document";
        const publicId = `${session.user.id}_${sanitizedType}_${timestamp}_${randomString}`;

        // Determine resource type - PDFs should use 'raw' or 'auto'
        const resourceType = file.type === 'application/pdf' ? 'raw' : 'image';

        // Upload to Cloudinary
        let result;
        try {
            result = await uploadToCloudinary(buffer, {
                folder: "corecreator/kyc-documents",
                publicId,
                resourceType: resourceType as 'image' | 'raw',
            });
        } catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            return NextResponse.json(
                { error: "Document upload service is temporarily unavailable. Please try again later." },
                { status: 503 }
            );
        }

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
        return NextResponse.json(
            { error: "An unexpected error occurred while uploading. Please try again." },
            { status: 500 }
        );
    }
}
