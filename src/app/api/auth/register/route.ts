import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { createNotification, NotificationType } from "@/lib/db/models/Notification";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, role } = await req.json();

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ["user", "studio"];
        if (role && !validRoles.includes(role)) {
            return NextResponse.json(
                { message: "Invalid role specified" },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { message: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { message: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Check if registration is open
        const { isRegistrationOpen } = await import("@/lib/system");
        if (!await isRegistrationOpen()) {
            return NextResponse.json(
                { message: "Registration is currently closed by the administrator." },
                { status: 403 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "user",
            isActive: true,
            isVerified: role === "studio" ? await (await import("@/lib/system")).isAutoApproveStudios() : false,
            preferences: {
                language: "en",
                currency: "USD",
                theme: "system",
                emailNotifications: true,
                pushNotifications: true,
            },
        });

        // Trigger notification for Admins if new user is a Studio
        if (role === "studio") {
            try {
                const admins = await User.find({ role: "admin" });
                const notificationPromises = admins.map(admin =>
                    createNotification({
                        recipientId: admin._id,
                        recipientModel: "Admin",
                        type: "studio_verified",
                        title: "New Studio Registration",
                        message: `A new studio "${name}" has registered and is awaiting verification.`,
                        data: {
                            link: `/admin/users?role=studio&search=${encodeURIComponent(email)}`,
                            studioId: user._id.toString()
                        }
                    })
                );
                await Promise.all(notificationPromises);
            } catch (notifyError) {
                console.error("Failed to notify admins of new studio:", notifyError);
                // Don't block registration if notification fails
            }
        }

        // Return success (without sensitive data)
        return NextResponse.json(
            {
                message: "Account created successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "An error occurred during registration" },
            { status: 500 }
        );
    }
}
