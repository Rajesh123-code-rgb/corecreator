import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { createResetToken, appUrl } from "@/lib/auth/passwordReset";
import { sendTemplatedEmail } from "@/lib/email/send";
import { getPasswordResetTemplate } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Always report success. Saying "no such account" here would let anyone
        // test which email addresses are registered.
        if (user) {
            const { rawToken, tokenHash, expiresAt } = createResetToken();
            user.resetPasswordToken = tokenHash;
            user.resetPasswordExpires = expiresAt;
            await user.save();

            const resetUrl = `${appUrl()}/reset-password?token=${rawToken}`;
            const isGuestClaim = Boolean(user.createdViaGuestCheckout && !user.password);
            await sendTemplatedEmail({
                key: isGuestClaim ? "guest_account_invite" : "password_reset",
                to: [{ email: user.email, name: user.name }],
                values: { name: user.name, resetUrl },
                fallbackSubject: isGuestClaim
                    ? "Set a password for your Core Creator account"
                    : "Reset your Core Creator password",
                fallbackHtml: getPasswordResetTemplate(user.name, resetUrl, isGuestClaim),
            });
        }

        return NextResponse.json({
            message: "If an account exists for that email, we've sent a link to reset the password.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
