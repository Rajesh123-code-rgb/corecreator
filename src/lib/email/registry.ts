import connectDB from "@/lib/db/mongodb";
import EmailTemplate from "@/lib/db/models/EmailTemplate";

/**
 * The transactional emails an admin may edit.
 *
 * Each entry declares the placeholders the template understands. Editing is
 * placeholder-based rather than a code editor: an admin writes `{{name}}` and
 * the sender substitutes it, so a template can be reworded without touching a
 * template literal or risking a syntax error in a running send path.
 */
export interface TemplateDefinition {
    key: string;
    name: string;
    description: string;
    /** When this email is sent, in plain language. */
    trigger: string;
    variables: { token: string; describes: string; sample: string }[];
    defaultSubject: string;
}

export const EMAIL_TEMPLATES: TemplateDefinition[] = [
    {
        key: "welcome",
        name: "Welcome",
        description: "Sent once, when someone finishes creating an account.",
        trigger: "A new account is created",
        variables: [{ token: "name", describes: "The person's name", sample: "Asha" }],
        defaultSubject: "Welcome to Core Creator",
    },
    {
        key: "order_confirmation",
        name: "Order confirmation",
        description: "The receipt a buyer gets once payment is confirmed.",
        trigger: "Payment is verified for an order",
        variables: [
            { token: "userName", describes: "The buyer's name", sample: "Asha" },
            { token: "orderNumber", describes: "Order reference", sample: "ORD-000123-MK1" },
            { token: "total", describes: "Amount paid, formatted", sample: "Rs. 1,799.00" },
            { token: "itemCount", describes: "Number of items", sample: "2" },
        ],
        defaultSubject: "Your Core Creator order is confirmed",
    },
    {
        key: "password_reset",
        name: "Password reset",
        description: "The link that lets someone set a new password.",
        trigger: "Someone requests a reset from Forgot password",
        variables: [
            { token: "name", describes: "The person's name", sample: "Asha" },
            { token: "resetUrl", describes: "The one-time reset link", sample: "https://corecreator.online/reset-password?token=…" },
        ],
        defaultSubject: "Reset your Core Creator password",
    },
    {
        key: "guest_account_invite",
        name: "Guest account invite",
        description: "Tells a guest buyer an account was created and how to claim it.",
        trigger: "A guest checkout completes payment",
        variables: [
            { token: "name", describes: "The buyer's name", sample: "Asha" },
            { token: "resetUrl", describes: "The link to set a password", sample: "https://corecreator.online/reset-password?token=…" },
        ],
        defaultSubject: "Set a password for your Core Creator account",
    },
];

export function getTemplateDefinition(key: string): TemplateDefinition | undefined {
    return EMAIL_TEMPLATES.find((t) => t.key === key);
}

/** Replaces {{token}} placeholders. Unknown tokens are left visible rather than
 *  blanked, so a typo shows up in a test send instead of silently vanishing. */
export function renderTemplate(html: string, values: Record<string, string | number>): string {
    return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, token) =>
        token in values ? String(values[token]) : match
    );
}

/**
 * The admin override for a key, or null when none is stored or it is parked.
 * Never throws - a template lookup must not be able to block a transactional
 * email, so a failure here falls back to the shipped default.
 */
export async function getStoredTemplate(
    key: string
): Promise<{ subject: string; htmlContent: string } | null> {
    try {
        await connectDB();
        const row = await EmailTemplate.findOne({ key, isActive: true }).lean() as any;
        if (!row?.htmlContent) return null;
        return { subject: row.subject, htmlContent: row.htmlContent };
    } catch (error) {
        console.error(`Email template lookup failed for "${key}", using default:`, error);
        return null;
    }
}
