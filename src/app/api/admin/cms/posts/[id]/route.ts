import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Post from "@/lib/db/models/Post";
import { PERMISSIONS } from "@/lib/config/rbac";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
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

        const post = await Post.findById(params.id).populate("author", "name");

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json({ post });

    } catch (error) {
        console.error("CMS Get Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
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

        const post = await Post.findByIdAndUpdate(
            params.id,
            { ...body, updatedAt: new Date() },
            { new: true }
        );

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, post });

    } catch (error) {
        console.error("CMS Update Error:", error);
        return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
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

        const post = await Post.findByIdAndDelete(params.id);

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Post deleted" });

    } catch (error) {
        console.error("CMS Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
