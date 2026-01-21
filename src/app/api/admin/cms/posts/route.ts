import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Post from "@/lib/db/models/Post";
import User from "@/lib/db/models/User";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasPermission =
            session.user.role === "admin" &&
            (session.user.adminRole === "super" || session.user.permissions?.includes(PERMISSIONS.MANAGE_CMS));

        if (!hasPermission) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const query: any = {};
        if (status && status !== "all") query.status = status;
        if (search) query.title = { $regex: search, $options: "i" };

        const [posts, total] = await Promise.all([
            Post.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "name")
                .lean(),
            Post.countDocuments(query),
        ]);

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error("CMS API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const hasPermission =
            session.user.role === "admin" &&
            (session.user.adminRole === "super" || session.user.permissions?.includes(PERMISSIONS.MANAGE_CMS));

        if (!hasPermission) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();

        await connectDB();

        const post = await Post.create({
            ...body,
            author: session.user.id,
            status: "draft"
        });

        return NextResponse.json({ success: true, post });

    } catch (error) {
        console.error("CMS Create Error:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
