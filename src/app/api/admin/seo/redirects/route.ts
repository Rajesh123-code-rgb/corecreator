import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SystemConfig from "@/lib/db/models/SystemConfig";
import connectDB from "@/lib/db/mongodb";
import fs from "fs/promises";
import path from "path";

const REDIRECTS_PATH = path.join(process.cwd(), "public", "redirects.json");

async function updateRedirectsJson(redirects: any[]) {
    try {
        await fs.writeFile(REDIRECTS_PATH, JSON.stringify(redirects, null, 2));
    } catch (error) {
        console.error("Failed to write redirects.json:", error);
    }
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const config = await SystemConfig.findOne({ key: "seo_redirects" });
        return NextResponse.json(config?.value || []);
    } catch (error) {
        console.error("Failed to fetch redirects:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { source, destination, permanent } = await req.json();

        if (!source || !destination) {
            return NextResponse.json({ error: "Source and destination are required" }, { status: 400 });
        }

        await connectDB();

        // Fetch existing redirects
        let config = await SystemConfig.findOne({ key: "seo_redirects" });
        let redirects = config?.value || [];

        // Add new redirect
        const newRedirect = {
            id: Date.now().toString(),
            source: source.startsWith("/") ? source : `/${source}`,
            destination: destination.startsWith("/") || destination.startsWith("http") ? destination : `/${destination}`,
            permanent: !!permanent,
            createdAt: new Date().toISOString()
        };

        redirects.push(newRedirect);

        // Update DB
        await SystemConfig.findOneAndUpdate(
            { key: "seo_redirects" },
            { value: redirects },
            { upsert: true, new: true }
        );

        // Update public JSON file
        await updateRedirectsJson(redirects);

        return NextResponse.json({ success: true, redirect: newRedirect });
    } catch (error) {
        console.error("Failed to add redirect:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await connectDB();

        const config = await SystemConfig.findOne({ key: "seo_redirects" });
        if (!config) {
            return NextResponse.json({ error: "No redirects found" }, { status: 404 });
        }

        const redirects = config.value.filter((r: any) => r.id !== id);

        await SystemConfig.findOneAndUpdate(
            { key: "seo_redirects" },
            { value: redirects }
        );

        // Update public JSON file
        await updateRedirectsJson(redirects);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete redirect:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
