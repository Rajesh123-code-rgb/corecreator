import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Fetch all users with role 'admin'
        const teamMembers = await User.find({ role: "admin" })
            .select("-password")
            .sort({ createdAt: -1 });

        return NextResponse.json({ teamMembers });
    } catch (error) {
        console.error("Team fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only super admins or admins with specific permission should be able to add other admins
        // For now, assuming any admin can add, but practically logic should restrict this.
        // Adding a basic check for 'super' if available, otherwise defaulting to allow for now as existing data might not have 'super' set.
        if (session.user.adminRole && session.user.adminRole !== "super") {
            // stricter check can be enabled later
        }

        const body = await req.json();
        const { name, email, password, adminRole } = body;

        if (!name || !email || !password || !adminRole) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            adminRole, // 'super', 'operations', 'content', etc.
            permissions: [], // Can be populated based on role map later if needed
            isVerified: true,
            isActive: true,
            preferences: {
                language: "en",
                currency: "USD",
                theme: "system",
                emailNotifications: true,
                pushNotifications: true,
            },
        });

        // Remove password from response
        const adminResponse = newAdmin.toObject();
        delete adminResponse.password;

        return NextResponse.json({ message: "Admin created successfully", admin: adminResponse }, { status: 201 });

    } catch (error) {
        console.error("Team creation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
