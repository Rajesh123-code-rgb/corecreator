import { notFound, redirect } from "next/navigation";
import connectDB from "@/lib/db/mongodb";
import SystemConfig from "@/lib/db/models/SystemConfig";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: "Page Not Found",
        robots: { index: false, follow: false }
    };
}

export default async function CatchAllPage({ params }: Props) {
    const { slug } = await params;
    // Reconstruct path from slug array
    const path = "/" + slug.join("/");

    try {
        await connectDB();
        const config = await SystemConfig.findOne({ key: "seo_redirects" });
        const redirects = config?.value || [];

        const match = redirects.find((r: any) => r.source === path || r.source === path + "/");

        if (match) {
            redirect(match.destination);
        }
    } catch (error) {
        console.error("Redirect check error:", error);
    }

    // If no redirect found, show 404
    notFound();
}
