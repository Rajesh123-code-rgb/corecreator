import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { hasAdminPermission } from "@/lib/config/permissions";
import { PERMISSIONS } from "@/lib/config/rbac";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC Check with fallback for admin role
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_USERS)) {
            return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const role = searchParams.get("role");
        const search = searchParams.get("search");

        const query: any = {};

        if (role && role !== "all") {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-password") // Exclude password
                .lean(),
            User.countDocuments(query),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Admin Users API Error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// POST - Create new user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC Check
        if (!hasAdminPermission(session, PERMISSIONS.MANAGE_USERS)) {
            return NextResponse.json({ error: "Forbidden: Insufficient Permissions" }, { status: 403 });
        }

        await connectDB();

        const body = await request.json();
        const { name, email, password, role } = body;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "user",
            isVerified: true, // Admin-created users are auto-verified
            isActive: true,
        });

        // Return user without password
        const userResponse = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
        };

        return NextResponse.json({ user: userResponse, message: "User created successfully" }, { status: 201 });
    } catch (error) {
        console.error("Create User API Error:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

