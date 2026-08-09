import crypto from "crypto";

// The raw token goes in the email; only its hash is stored, so a leaked
// database dump cannot be used to take over accounts.
export function createResetToken() {
    const rawToken = crypto.randomBytes(32).toString("hex");
    return {
        rawToken,
        tokenHash: hashResetToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };
}

export function hashResetToken(rawToken: string) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function appUrl() {
    return (
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        "https://corecreator.online"
    ).replace(/\/$/, "");
}
