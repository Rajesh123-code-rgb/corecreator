import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { logAudit } from "@/lib/db/models/AuditLog";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { documents, personalDetails, address } = body;

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return NextResponse.json({ error: "Please upload your verification documents before submitting." }, { status: 400 });
        }

        await connectDB();

        const setFields: any = {
            "kyc.status": "pending",
            "kyc.submittedAt": new Date(),
            "kyc.documents": documents,
            "kyc.rejectionReason": null
        };

        // Update profile details if provided
        if (personalDetails) {
            if (personalDetails.name) setFields["name"] = personalDetails.name;
            if (personalDetails.phone) setFields["profile.phone"] = personalDetails.phone;
        }

        // Add studio address
        if (address) {
            // Remove existing work address to avoid duplicates during re-submission
            await User.findByIdAndUpdate(session.user.id, {
                $pull: { addresses: { type: "work" } }
            });

            // Use $set and $push together properly structured
            const updatedUser = await User.findByIdAndUpdate(
                session.user.id,
                {
                    $set: setFields,
                    $push: {
                        addresses: {
                            type: "work",
                            street: address.street,
                            city: address.city,
                            state: address.state,
                            zipCode: address.zipCode,
                            country: address.country,
                            isDefault: true
                        }
                    }
                },
                { new: true }
            );

            // Audit Log
            await logAudit({
                userId: session.user.id,
                action: "KYC_SUBMITTED",
                resource: "User",
                resourceId: session.user.id,
                description: "Studio KYC documents submitted for verification",
                severity: "info"
            });

            return NextResponse.json({ message: "KYC Submitted", status: updatedUser?.kyc?.status });
        }

        // No address provided — just update KYC fields
        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $set: setFields },
            { new: true }
        );

        // Audit Log
        await logAudit({
            userId: session.user.id,
            action: "KYC_SUBMITTED",
            resource: "User",
            resourceId: session.user.id,
            description: "Studio KYC documents submitted for verification",
            severity: "info"
        });

        return NextResponse.json({ message: "KYC Submitted", status: updatedUser?.kyc?.status });
    } catch (error) {
        console.error("KYC Submit Error:", error);
        return NextResponse.json({ error: "Something went wrong while submitting your verification. Please try again later." }, { status: 500 });
    }
}
