import { sendEmail } from "@/lib/email/brevo";
import { getStoredTemplate, getTemplateDefinition, renderTemplate } from "@/lib/email/registry";

/**
 * Sends a transactional email, preferring an admin-edited template over the
 * version shipped in code.
 *
 * The fallback matters: if the lookup fails, or an admin has parked their edit,
 * or nobody has ever customised this email, the shipped default is used. A
 * template problem must never be able to stop a receipt or a reset link going
 * out.
 */
export async function sendTemplatedEmail(opts: {
    key: string;
    to: { email: string; name: string }[];
    values: Record<string, string | number>;
    /** Used when no override is stored. */
    fallbackSubject: string;
    fallbackHtml: string;
}): Promise<boolean> {
    const def = getTemplateDefinition(opts.key);
    const stored = await getStoredTemplate(opts.key);

    const subject = stored
        ? renderTemplate(stored.subject, opts.values)
        : opts.fallbackSubject;
    const htmlContent = stored
        ? renderTemplate(stored.htmlContent, opts.values)
        : opts.fallbackHtml;

    return sendEmail({
        to: opts.to,
        subject: subject || def?.defaultSubject || "Core Creator",
        htmlContent,
    });
}
