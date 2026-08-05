import { MetadataRoute } from "next";
import connectDB from "@/lib/db/mongodb";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import Workshop from "@/lib/db/models/Workshop";
import Post from "@/lib/db/models/Post";
import { siteConfig } from "@/lib/seo";
import { categories as productCategories } from "@/lib/categories";
import { courseCategories } from "@/lib/courseCategories";

// Regenerated on every request (cached by Next.js per revalidate window), so
// it can never drift from the live database the way the old admin-generated
// static public/sitemap.xml did.
export const revalidate = 3600; // 1 hour

const BASE_URL = siteConfig.url;

function url(
    path: string,
    overrides: Partial<MetadataRoute.Sitemap[number]> = {}
): MetadataRoute.Sitemap[number] {
    return {
        url: `${BASE_URL}${path}`,
        changeFrequency: "weekly",
        priority: 0.5,
        ...overrides,
    };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    await connectDB();

    const staticRoutes: MetadataRoute.Sitemap = [
        url("/", { changeFrequency: "daily", priority: 1 }),
        url("/marketplace", { changeFrequency: "daily", priority: 0.9 }),
        url("/marketplace/best-sellers", { changeFrequency: "daily", priority: 0.7 }),
        url("/marketplace/new", { changeFrequency: "daily", priority: 0.7 }),
        url("/learn", { changeFrequency: "daily", priority: 0.9 }),
        url("/learn/categories", { changeFrequency: "weekly", priority: 0.7 }),
        url("/learning-paths", { changeFrequency: "weekly", priority: 0.6 }),
        url("/workshops", { changeFrequency: "daily", priority: 0.8 }),
        url("/product/categories", { changeFrequency: "weekly", priority: 0.7 }),
        url("/artists", { changeFrequency: "weekly", priority: 0.5 }),
        url("/blog", { changeFrequency: "weekly", priority: 0.6 }),
        url("/pricing", { changeFrequency: "monthly", priority: 0.7 }),
        url("/about", { changeFrequency: "monthly", priority: 0.5 }),
        url("/faqs", { changeFrequency: "monthly", priority: 0.5 }),
        url("/help", { changeFrequency: "monthly", priority: 0.4 }),
        url("/documentation", { changeFrequency: "monthly", priority: 0.4 }),
        url("/contact", { changeFrequency: "monthly", priority: 0.4 }),
        url("/careers", { changeFrequency: "monthly", priority: 0.3 }),
        url("/tutorials", { changeFrequency: "monthly", priority: 0.4 }),
        url("/certificates", { changeFrequency: "monthly", priority: 0.3 }),
        url("/studio/register", { changeFrequency: "monthly", priority: 0.7 }),
        url("/studio/login", { changeFrequency: "yearly", priority: 0.2 }),
        url("/register", { changeFrequency: "yearly", priority: 0.4 }),
        url("/login", { changeFrequency: "yearly", priority: 0.2 }),
        url("/returns", { changeFrequency: "yearly", priority: 0.3 }),
        url("/shipping", { changeFrequency: "yearly", priority: 0.3 }),
        url("/accessibility", { changeFrequency: "yearly", priority: 0.2 }),
        url("/terms", { changeFrequency: "yearly", priority: 0.2 }),
        url("/privacy", { changeFrequency: "yearly", priority: 0.2 }),
        url("/cookies", { changeFrequency: "yearly", priority: 0.2 }),
    ];

    const categoryRoutes: MetadataRoute.Sitemap = [
        ...productCategories.map((c) =>
            url(`/product/categories/${c.slug}`, { changeFrequency: "weekly", priority: 0.6 })
        ),
        ...courseCategories.map((c) =>
            url(`/learn/categories/${c.slug}`, { changeFrequency: "weekly", priority: 0.6 })
        ),
    ];

    const [products, courses, workshops, posts] = await Promise.all([
        Product.find({ status: "active" }).select("slug updatedAt").lean(),
        Course.find({ status: "published" }).select("slug updatedAt").lean(),
        Workshop.find({ status: { $in: ["upcoming", "completed"] } })
            .select("slug updatedAt")
            .lean(),
        Post.find({ status: "published" }).select("slug updatedAt").lean(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p: any) =>
        url(`/marketplace/${p.slug}`, {
            lastModified: p.updatedAt,
            changeFrequency: "weekly",
            priority: 0.8,
        })
    );

    const courseRoutes: MetadataRoute.Sitemap = courses.map((c: any) =>
        url(`/learn/${c.slug}`, {
            lastModified: c.updatedAt,
            changeFrequency: "weekly",
            priority: 0.8,
        })
    );

    const workshopRoutes: MetadataRoute.Sitemap = workshops.map((w: any) =>
        url(`/workshops/${w.slug}`, {
            lastModified: w.updatedAt,
            changeFrequency: "weekly",
            priority: 0.7,
        })
    );

    const postRoutes: MetadataRoute.Sitemap = posts.map((p: any) =>
        url(`/blog/${p.slug}`, {
            lastModified: p.updatedAt,
            changeFrequency: "monthly",
            priority: 0.6,
        })
    );

    return [
        ...staticRoutes,
        ...categoryRoutes,
        ...productRoutes,
        ...courseRoutes,
        ...workshopRoutes,
        ...postRoutes,
    ];
}
