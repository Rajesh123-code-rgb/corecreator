import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Post from "@/lib/db/models/Post";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");
        const category = searchParams.get("category");
        const search = searchParams.get("search");

        const skip = (page - 1) * limit;

        // Build query - only get published posts
        const query: Record<string, unknown> = { status: "published" };

        if (category && category !== "all") {
            query.tags = { $in: [category] };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { excerpt: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
            ];
        }

        const [posts, total] = await Promise.all([
            Post.find(query)
                .populate("author", "name image")
                .sort({ publishedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Post.countDocuments(query),
        ]);

        // Transform posts for frontend
        const transformedPosts = posts.map((post: any) => ({
            _id: post._id.toString(),
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            author: {
                name: post.author?.name || "Core Creator Team",
                image: post.author?.image,
            },
            tags: post.tags || [],
            publishedAt: post.publishedAt || post.createdAt,
            createdAt: post.createdAt,
        }));

        return NextResponse.json({
            posts: transformedPosts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Public posts fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch posts" },
            { status: 500 }
        );
    }
}
