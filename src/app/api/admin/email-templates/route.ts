import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import EmailTemplate from "@/lib/db/models/EmailTemplate";
import { EMAIL_TEMPLATES, getTemplateDefinition } from "@/lib/email/registry";
import {
    getWelcomeEmailTemplate,
    getOrderConfirmationTemplate,
    getPasswordResetTemplate,
} from "@/lib/email/templates";

/** The shipped version of each template, used when no override is stored. */
function shippedHtml(key: string): string {
    switch (key) {
        case "welcome":
            return getWelcomeEmailTemplate("{{name}}");
        case "order_confirmation":
            return getOrderConfirmationTemplate(
                { orderNumber: "{{orderNumber}}", total: "{{total}}", items: [] },
                "{{userName}}"
            );
        case "password_reset":
            return getPasswordResetTemplate("{{name}}", "{{resetUrl}}", false);
        case "guest_account_invite":
            return getPasswordResetTemplate("{{name}}", "{{resetUrl}}", true);
        default:
            return "";
    }
}

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return null;
    return session;
}

export async function GET() {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const overrides = await EmailTemplate.find({}).lean();
    const byKey = new Map(overrides.map((o: any) => [o.key, o]));

    const templates = EMAIL_TEMPLATES.map((def) => {
        const stored = byKey.get(def.key) as any;
        return {
            ...def,
            subject: stored?.subject ?? def.defaultSubject,
            htmlContent: stored?.htmlContent ?? shippedHtml(def.key),
            isCustomised: Boolean(stored),
            isActive: stored?.isActive ?? true,
            updatedAt: stored?.updatedAt ?? null,
        };
    });

    // Surfaced so an admin can see whether email can send at all, rather than
    // discovering it from a customer who never got their receipt.
    const delivery = {
        configured: Boolean(process.env.BREVO_API_KEY),
        senderEmail: process.env.BREVO_SENDER_EMAIL || "(not set — using noreply@corecreator.online)",
        senderName: process.env.BREVO_SENDER_NAME || "(not set — using Core Creator)",
    };

    return NextResponse.json({ templates, delivery });
}

export async function PUT(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key, subject, htmlContent, isActive } = await request.json();
    if (!getTemplateDefinition(key)) {
        return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }
    if (!subject?.trim() || !htmlContent?.trim()) {
        return NextResponse.json({ error: "Subject and content are both required" }, { status: 400 });
    }

    await connectDB();
    await EmailTemplate.findOneAndUpdate(
        { key },
        { key, subject, htmlContent, isActive: isActive !== false, updatedBy: session.user.id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({ message: "Template saved" });
}

/** Reverts to the shipped version by removing the override. */
export async function DELETE(request: NextRequest) {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const key = new URL(request.url).searchParams.get("key");
    if (!key || !getTemplateDefinition(key)) {
        return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }
    await connectDB();
    await EmailTemplate.deleteOne({ key });
    return NextResponse.json({ message: "Reverted to the default template" });
}
