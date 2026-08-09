import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { hashResetToken } from "@/lib/auth/passwordReset";

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Reset token is missing." }, { status: 400 });
        }
        if (!password || typeof password !== "string" || password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters." },
                { status: 400 }
            );
        }

        await connectDB();

        // Look the token up by hash, and require it to be unexpired in the same
        // query so an expired token can never match.
        const user = await User.findOne({
            resetPasswordToken: hashResetToken(token),
            resetPasswordExpires: { $gt: new Date() },
        }).select("+password +resetPasswordToken +resetPasswordExpires");

        if (!user) {
            return NextResponse.json(
                { error: "This reset link is invalid or has expired. Please request a new one." },
                { status: 400 }
            );
        }

        user.password = await bcrypt.hash(password, 12);
        // Single use - clear the token so the same link cannot be replayed.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        // Setting a password from a link sent to their address proves they own
        // the mailbox, so a guest-created account is now fully theirs.
        user.createdViaGuestCheckout = false;
        await user.save();

        return NextResponse.json({ message: "Your password has been set. You can now sign in." });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
