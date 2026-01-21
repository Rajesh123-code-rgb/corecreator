import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import Workshop from "@/lib/db/models/Workshop";
import fs from "fs/promises";
import path from "path";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://corecreator.com";
const PUBLIC_DIR = path.join(process.cwd(), "public");

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        // 1. Static Pages
        const staticPages = [
            "",
            "/marketplace",
            "/learn",
            "/teach",
            "/workshops",
            "/about",
            "/contact",
            "/login",
            "/register",
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        staticPages.forEach(page => {
            sitemap += `
    <url>
        <loc>${SITE_URL}${page}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
        });

        // 2. Fetch Dynamic Content
        const [products, courses, workshops] = await Promise.all([
            Product.find({ status: "active" }).select("slug updatedAt"),
            Course.find({ status: "published" }).select("slug updatedAt"),
            Workshop.find({ status: "published" }).select("slug updatedAt"),
        ]);

        // Add Products
        products.forEach((p: any) => {
            sitemap += `
    <url>
        <loc>${SITE_URL}/product/${p.slug}</loc>
        <lastmod>${new Date(p.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
        });

        // Add Courses
        courses.forEach((c: any) => {
            sitemap += `
    <url>
        <loc>${SITE_URL}/course/${c.slug}</loc>
        <lastmod>${new Date(c.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
        });

        // Add Workshops
        workshops.forEach((w: any) => {
            sitemap += `
    <url>
        <loc>${SITE_URL}/workshop/${w.slug}</loc>
        <lastmod>${new Date(w.updatedAt).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
        });

        sitemap += `
</urlset>`;

        // 3. Write sitemap.xml to public directory
        await fs.writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), sitemap);

        return NextResponse.json({
            success: true,
            message: `Generated sitemap with ${staticPages.length + products.length + courses.length + workshops.length} URLs`
        });

    } catch (error) {
        console.error("Sitemap generation error:", error);
        return NextResponse.json({ error: "Failed to generate sitemap" }, { status: 500 });
    }
}
