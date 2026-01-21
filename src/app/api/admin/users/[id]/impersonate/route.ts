
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/lib/db/models/User";
import connectDB from "@/lib/db/mongodb";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check for specific MANAGE_USERS permission if needed, but role check is strict specifically for this dangerous action
        // Ideally we should also check permissions but for now admin role is the gatekeeper

        await connectDB();
        const { id } = await params;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.role === "admin") {
            return NextResponse.json({ error: "Cannot impersonate another admin" }, { status: 403 });
        }

        // Create the token payload
        // This MUST match the structure in [...]nextauth/route.ts jwt callback
        const tokenPayload = {
            id: targetUser._id.toString(),
            name: targetUser.name,
            email: targetUser.email,
            picture: targetUser.avatar,
            role: targetUser.role,
            adminRole: targetUser.adminRole,
            permissions: targetUser.permissions,
            sub: targetUser._id.toString(),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        };

        const encodedToken = await encode({
            token: tokenPayload,
            secret: process.env.NEXTAUTH_SECRET || "supersecret", // Fallback should match .env
        });

        // Set the session cookie
        const cookieStore = await cookies();
        const secureInfo = process.env.NODE_ENV === 'production' ? '__Secure-' : '';
        const cookieName = `${secureInfo}next-auth.session-token`;

        cookieStore.set(cookieName, encodedToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Impersonation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
