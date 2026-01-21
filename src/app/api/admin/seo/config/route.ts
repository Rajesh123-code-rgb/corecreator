import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import SystemConfig from "@/lib/db/models/SystemConfig";

// Define path to robots.txt in public folder
const ROBOTS_PATH = path.join(process.cwd(), "public", "robots.txt");

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let content = "";
        try {
            content = await fs.readFile(ROBOTS_PATH, "utf-8");
        } catch (err) {
            // If file doesn't exist, return default content
            content = "User-agent: *\nAllow: /";
        }

        const globalSeo = await SystemConfig.findOne({ key: "seo_global" });

        return NextResponse.json({
            robotsTxt: content,
            general: globalSeo?.value || {}
        });
    } catch (error) {
        console.error("Failed to read SEO config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { type, content } = await req.json();

        if (type === "robots") {
            await fs.writeFile(ROBOTS_PATH, content);
            return NextResponse.json({ success: true, message: "Robots.txt updated" });
        }

        if (type === "general") {
            await SystemConfig.findOneAndUpdate(
                { key: "seo_global" },
                { value: content },
                { upsert: true, new: true }
            );
            return NextResponse.json({ success: true, message: "SEO settings updated" });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (error) {
        console.error("Failed to update SEO config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
