import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Settings, { invalidateSettingsCache } from "@/lib/db/models/Settings";

// GET - Fetch platform settings
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        let settings = await Settings.findOne({ key: "platform" });

        if (!settings) {
            settings = await Settings.create({ key: "platform" });
        }

        // Mask sensitive data
        const sanitizedSettings = {
            ...settings.toObject(),
            payments: settings.payments ? {
                razorpay: {
                    ...settings.payments.razorpay,
                    keySecret: settings.payments.razorpay?.keySecret ? "••••••••" : "",
                    webhookSecret: settings.payments.razorpay?.webhookSecret ? "••••••••" : "",
                },
                stripe: {
                    ...settings.payments.stripe,
                    secretKey: settings.payments.stripe?.secretKey ? "••••••••" : "",
                    webhookSecret: settings.payments.stripe?.webhookSecret ? "••••••••" : "",
                },
            } : undefined,
            email: settings.email ? {
                ...settings.email,
                smtpPassword: settings.email.smtpPassword ? "••••••••" : "",
            } : undefined,
        };

        return NextResponse.json({ settings: sanitizedSettings });
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// PUT - Update platform settings
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check for super admin or finance admin for commission changes
        const adminRole = session.user.adminRole;

        await connectDB();

        const body = await request.json();
        const { section, data } = body;

        if (!section || !data) {
            return NextResponse.json({ error: "Section and data are required" }, { status: 400 });
        }

        // Validate section
        const allowedSections = ["general", "commission", "payments", "email", "security", "notifications"];
        if (!allowedSections.includes(section)) {
            return NextResponse.json({ error: "Invalid settings section" }, { status: 400 });
        }

        // Commission changes require super admin
        if (section === "commission" && adminRole !== "super") {
            return NextResponse.json({ error: "Only super admins can modify commission settings" }, { status: 403 });
        }

        // Handle password fields - don't overwrite if masked
        if (section === "payments" && data.razorpay) {
            if (data.razorpay.keySecret === "••••••••") {
                delete data.razorpay.keySecret;
            }
            if (data.razorpay.webhookSecret === "••••••••") {
                delete data.razorpay.webhookSecret;
            }
        }
        if (section === "payments" && data.stripe) {
            if (data.stripe.secretKey === "••••••••") {
                delete data.stripe.secretKey;
            }
            if (data.stripe.webhookSecret === "••••••••") {
                delete data.stripe.webhookSecret;
            }
        }
        if (section === "email" && data.smtpPassword === "••••••••") {
            delete data.smtpPassword;
        }

        // Update settings
        const updateQuery = {} as Record<string, unknown>;
        for (const [key, value] of Object.entries(data)) {
            updateQuery[`${section}.${key}`] = value;
        }
        updateQuery["updatedBy"] = session.user.id;

        const settings = await Settings.findOneAndUpdate(
            { key: "platform" },
            { $set: updateQuery },
            { new: true, upsert: true }
        );

        // Invalidate cache
        invalidateSettingsCache();

        return NextResponse.json({
            success: true,
            message: `${section} settings updated successfully`,
            settings: settings?.[section as keyof typeof settings]
        });
    } catch (error) {
        console.error("Failed to update settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
