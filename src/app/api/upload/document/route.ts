import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads", "documents");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename with user ID prefix for organization
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split(".").pop() || "jpg";
        const sanitizedType = type?.replace(/[^a-z_]/gi, "") || "document";
        const filename = `${session.user.id}_${sanitizedType}_${timestamp}_${randomString}.${extension}`;

        // Convert file to buffer and write
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return the public URL
        const url = `/uploads/documents/${filename}`;

        return NextResponse.json({
            success: true,
            url,
            type: sanitizedType,
            filename: file.name,
            size: file.size,
        });
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}
