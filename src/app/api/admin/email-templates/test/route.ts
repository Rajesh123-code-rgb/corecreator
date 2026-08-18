import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email/brevo";
import { getTemplateDefinition, renderTemplate } from "@/lib/email/registry";

/**
 * Sends one template to a chosen address with sample values.
 *
 * This is how email delivery gets confirmed without waiting for a real order:
 * if it arrives, Brevo is configured and the sender domain is accepted. The
 * response distinguishes "we could not reach Brevo" from "Brevo accepted it",
 * because those need very different fixes.
 */
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.BREVO_API_KEY) {
        return NextResponse.json(
            {
                error: "Email is not configured",
                detail: "BREVO_API_KEY is not set on the server, so nothing can be sent. Add it to .env.production and recreate the container.",
            },
            { status: 400 }
        );
    }

    const { key, to, subject, htmlContent } = await request.json();
    const def = getTemplateDefinition(key);
    if (!def) return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return NextResponse.json({ error: "Enter a valid email address to send the test to" }, { status: 400 });
    }

    // Sample values so the test looks like a real send rather than raw tokens.
    const values = Object.fromEntries(def.variables.map((v) => [v.token, v.sample]));

    const ok = await sendEmail({
        to: [{ email: to, name: "Test recipient" }],
        subject: `[TEST] ${renderTemplate(subject || def.defaultSubject, values)}`,
        htmlContent: renderTemplate(htmlContent || "", values),
    });

    if (!ok) {
        return NextResponse.json(
            {
                error: "Brevo rejected the send",
                detail: "The API key is set but the request failed. Check the container logs for the Brevo error, and confirm the sender domain is verified in your Brevo account.",
            },
            { status: 502 }
        );
    }

    return NextResponse.json({ message: `Test email sent to ${to}. If it doesn't arrive, check spam and your Brevo sender domain.` });
}
