import { getWelcomeEmailTemplate, getOrderConfirmationTemplate } from './templates';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface EmailRecipient {
    name: string;
    email: string;
}

interface BrevoEmailPayload {
    sender: EmailRecipient;
    to: EmailRecipient[];
    subject: string;
    htmlContent: string;
    tags?: string[];
}

/**
 * Core wrapper to send an email via Brevo REST API using native fetch
 */
export async function sendEmail(payload: Omit<BrevoEmailPayload, 'sender'>) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@corecreator.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Core Creator';

    if (!apiKey) {
        console.warn('⚠️ BREVO_API_KEY is not set. Email dispatch aborted.');
        console.dir(payload, { depth: null });
        return false;
    }

    try {
        const fullPayload: BrevoEmailPayload = {
            ...payload,
            sender: {
                name: senderName,
                email: senderEmail,
            }
        };

        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify(fullPayload),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Brevo API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        console.log(`✉️ Email successfully dispatched to ${payload.to.map(t => t.email).join(', ')} (Message ID: ${data.messageId})`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email via Brevo:', error);
        return false;
    }
}

// --------------------------------------------------------------------------
// Trigger Functions
// --------------------------------------------------------------------------

/**
 * Send Welcome Email to a new user
 */
export async function sendWelcomeEmail(userName: string, userEmail: string) {
    return sendEmail({
        to: [{ name: userName, email: userEmail }],
        subject: 'Welcome to Core Creator!',
        htmlContent: getWelcomeEmailTemplate(userName),
        tags: ['welcome', 'onboarding'],
    });
}

/**
 * Send Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(order: any, userName: string, userEmail: string) {
    return sendEmail({
        to: [{ name: userName, email: userEmail }],
        subject: `Order Confirmation #${order.orderNumber}`,
        htmlContent: getOrderConfirmationTemplate(order, userName),
        tags: ['order', 'transactional'],
    });
}
