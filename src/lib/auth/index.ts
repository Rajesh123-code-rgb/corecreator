import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import clientPromise from "@/lib/db/mongodb-client";
import { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { logAudit } from "@/lib/db/models/AuditLog";

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise) as Adapter,
    providers: [
        // Credentials (Email/Password)
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();

                const user = await User.findOne({ email: credentials.email }).select("+password");
                try {
                    const fs = require('fs');
                    fs.appendFileSync('auth-debug.log', `[Authorize] Raw User from DB: ${JSON.stringify(user?.toJSON())}\n`);
                } catch (e) { }

                if (!user) {
                    throw new Error("No user found with this email");
                }

                if (!user.password) {
                    throw new Error("Please sign in with the provider you used to register");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                if (!user.isActive) {
                    throw new Error("Your account has been deactivated");
                }

                await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

                // Explicitly return the fields we want to persist
                const returnedUser = {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.avatar,
                    role: user.role,
                    adminRole: user.adminRole, // Ensure this field is populated
                    permissions: user.permissions,
                };

                // Log login activity
                await logAudit({
                    userId: user._id,
                    action: "LOGIN",
                    resource: "Auth",
                    description: "User logged in via Credentials",
                    ipAddress: "Unknown", // Can't easily get IP here without dirty hacks or passing it from route
                    severity: "info"
                });

                try {
                    const fs = require('fs');
                    fs.appendFileSync('auth-debug.log', `[Authorize] User: ${JSON.stringify(returnedUser)}\n`);
                } catch (e) { }

                return returnedUser;
            },
        }),

        // Google OAuth
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    role: "user",
                };
            },
        }),

        // Facebook OAuth
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture?.data?.url,
                    role: "user",
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: "/login",
        newUser: "/register",
        error: "/login",
    },

    callbacks: {
        async jwt({ token, user, trigger, session, account }) {
            try {
                const fs = require('fs');
                fs.appendFileSync('auth-debug.log', `[JWT] Trigger: ${trigger}, User: ${JSON.stringify(user)}, Token before: ${JSON.stringify(token)}\n`);
            } catch (e) { }

            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.adminRole = (user as any).adminRole;
                token.permissions = (user as any).permissions;
                token.provider = account?.provider;
            }

            if (trigger === "update" && session) {
                token.name = session.name;
                token.role = session.role;
            }

            try {
                const fs = require('fs');
                fs.appendFileSync('auth-debug.log', `[JWT] Token after: ${JSON.stringify(token)}\n`);
            } catch (e) { }

            return token;
        },

        async session({ session, token }) {
            try {
                const fs = require('fs');
                fs.appendFileSync('auth-debug.log', `[Session] Token: ${JSON.stringify(token)}\n`);
            } catch (e) { }

            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.adminRole = token.adminRole as string;
                session.user.permissions = token.permissions as string[];
            }

            try {
                const fs = require('fs');
                fs.appendFileSync('auth-debug.log', `[Session] Final Session: ${JSON.stringify(session)}\n`);
            } catch (e) { }

            return session;
        },

        async signIn({ user, account }) {
            if (account?.provider !== "credentials") {
                await connectDB();

                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    await User.create({
                        email: user.email || "",
                        name: user.name || "",
                        avatar: user.image || "",
                        role: "user",
                        isVerified: true,
                        isActive: true,
                        accounts: [{ provider: account?.provider || "", providerAccountId: account?.providerAccountId || "" }],
                        preferences: {
                            language: "en",
                            currency: "USD",
                            theme: "system",
                            emailNotifications: true,
                            pushNotifications: true,
                        },
                    });
                } else {
                    await User.findByIdAndUpdate(existingUser._id, { lastLoginAt: new Date() });
                    await logAudit({
                        userId: existingUser._id,
                        action: "LOGIN",
                        resource: "Auth",
                        description: `User logged in via ${account?.provider}`,
                        severity: "info"
                    });
                }
            } else if (account?.provider === "credentials") {
                // Already logged in authorize, but good to double check or leave empty
            }
            return true;
        },
    },

    events: {
        async signOut({ token }: { token: any }) {
            if (token) {
                try {
                    await logAudit({
                        userId: token.id,
                        action: "LOGOUT",
                        resource: "Auth",
                        description: "User logged out",
                        severity: "info",
                    });
                } catch (error) {
                    console.error("SignOut log error:", error);
                }
            }
        },
    },

    debug: process.env.NODE_ENV === "development",
};
