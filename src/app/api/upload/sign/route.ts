import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Please log in to upload documents." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type } = body; // "id_proof" or "address_proof"

        const timestamp = Math.round(new Date().getTime() / 1000);
        const randomString = Math.random().toString(36).substring(2, 8);
        const sanitizedType = (type || "document").replace(/[^a-z_]/gi, "");
        const folder = "corecreator/kyc-documents";
        const publicId = `${session.user.id}_${sanitizedType}_${timestamp}_${randomString}`;

        // Generate signature for authenticated upload
        const paramsToSign = {
            timestamp,
            folder,
            public_id: publicId,
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET!
        );

        return NextResponse.json({
            signature,
            timestamp,
            folder,
            publicId,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
        });
    } catch (error) {
        console.error("Upload signature error:", error);
        return NextResponse.json(
            { error: "Failed to prepare upload. Please try again." },
            { status: 500 }
        );
    }
}
