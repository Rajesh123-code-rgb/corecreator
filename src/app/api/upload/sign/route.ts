import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Please log in to upload documents." },
                { status: 401 }
            );
        }

        // Validate environment variables
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.error("Missing Cloudinary env vars:", {
                hasCloudName: !!cloudName,
                hasApiKey: !!apiKey,
                hasApiSecret: !!apiSecret
            });
            return NextResponse.json(
                { error: "Upload service is not configured. Please contact support." },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { type } = body; // "id_proof" or "address_proof"

        const timestamp = Math.round(new Date().getTime() / 1000);
        const randomString = Math.random().toString(36).substring(2, 8);
        const sanitizedType = (type || "document").replace(/[^a-z_]/gi, "");
        const folder = "corecreator/kyc-documents";
        const publicId = `${session.user.id}_${sanitizedType}_${timestamp}_${randomString}`;

        // Generate signature manually (avoids dependency on cloudinary SDK bundling)
        // Cloudinary signature = SHA1(alphabetically sorted params + api_secret)
        const params: Record<string, string> = {
            folder,
            public_id: publicId,
            timestamp: timestamp.toString(),
        };

        // Sort params alphabetically and create the string to sign
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join("&");

        const signature = crypto
            .createHash("sha1")
            .update(sortedParams + apiSecret)
            .digest("hex");

        return NextResponse.json({
            signature,
            timestamp: timestamp.toString(),
            folder,
            publicId,
            cloudName,
            apiKey,
        });
    } catch (error) {
        console.error("Upload signature error:", error);
        return NextResponse.json(
            { error: "Failed to prepare upload. Please try again." },
            { status: 500 }
        );
    }
}
