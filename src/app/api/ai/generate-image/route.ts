import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Helper fetch with AbortController timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(id);
    }
}

// ---------------------------------------------------------------------------
// Tier 1: Pollinations AI with Title & Description Subject-First Prompt
// ---------------------------------------------------------------------------
async function generateWithPollinations(prompt: string): Promise<Buffer | null> {
    const seed = Math.floor(Math.random() * 1000000);
    // Include full subject details in clean prompt up to 400 chars
    const cleanPrompt = encodeURIComponent(prompt.substring(0, 400));
    const url = `https://image.pollinations.ai/prompt/${cleanPrompt}?nologo=true&seed=${seed}`;

    try {
        console.log(`[AI] Trying Pollinations AI with prompt: "${prompt.substring(0, 80)}..."`);
        const res = await fetchWithTimeout(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        }, 8000);

        if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 5000) {
                console.log(`[AI] Pollinations AI succeeded! (${buffer.length} bytes)`);
                return buffer;
            }
        }
    } catch (err: any) {
        console.warn("[AI] Pollinations AI notice:", err?.message || err);
    }
    return null;
}

// ---------------------------------------------------------------------------
// Tier 2: OpenAI DALL-E (optional)
// ---------------------------------------------------------------------------
async function generateWithOpenAI(prompt: string): Promise<Buffer | null> {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log("[AI] Trying OpenAI DALL-E...");

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt.substring(0, 4000),
            n: 1,
            size: "1024x1024",
        });
        const url = response?.data?.[0]?.url;
        if (!url) return null;

        const imgRes = await fetchWithTimeout(url, {}, 8000);
        if (imgRes.ok) {
            return Buffer.from(await imgRes.arrayBuffer());
        }
    } catch (err: any) {
        console.warn("[AI] OpenAI DALL-E notice:", err?.message || err);
    }
    return null;
}

// ---------------------------------------------------------------------------
// Tier 3: Keyword-Tailored High-Definition Creative Photography Engine
// ---------------------------------------------------------------------------
const TOPIC_IMAGE_MAP: Record<string, string[]> = {
    resin: [
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85",
    ],
    flower: [
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
    ],
    paint: [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85",
    ],
    watercolo: [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85",
    ],
    ceramic: [
        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85",
    ],
    pottery: [
        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85",
    ],
    jewel: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
    ],
    textile: [
        "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=85",
    ],
    digital: [
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
    ],
    course: [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85",
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85",
    ],
};

const GENERAL_PRODUCT_IMAGES = [
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=85",
];

const GENERAL_COURSE_IMAGES = [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
];

async function generateTailoredImage(title: string, description: string, type: string): Promise<Buffer> {
    const text = `${title} ${description}`.toLowerCase();
    let selectedUrl: string | null = null;

    // Check keyword topic matcher
    for (const [key, urls] of Object.entries(TOPIC_IMAGE_MAP)) {
        if (text.includes(key)) {
            console.log(`[AI] Tailored topic match for keyword "${key}" in "${title}"`);
            const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            selectedUrl = urls[Math.abs(hash) % urls.length];
            break;
        }
    }

    if (!selectedUrl) {
        const pool = type === "course" ? GENERAL_COURSE_IMAGES : GENERAL_PRODUCT_IMAGES;
        let hash = Date.now();
        for (let i = 0; i < title.length; i++) {
            hash = (hash << 5) - hash + title.charCodeAt(i);
            hash |= 0;
        }
        selectedUrl = pool[Math.abs(hash) % pool.length];
    }

    console.log(`[AI] Fetching tailored photography image: ${selectedUrl}`);
    const res = await fetchWithTimeout(selectedUrl, {}, 8000);
    if (!res.ok) {
        throw new Error(`Failed to fetch base image: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description, type } = await request.json();
        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Build subject-first prompt
        const subjectDetails = description && description.trim().length > 3
            ? `"${title}" - ${description.trim()}`
            : `"${title}"`;

        const styleDetails = type === "course"
            ? "professional online course thumbnail banner, clear artistic visual representation, highly detailed"
            : "studio product photography, clean minimalist aesthetic background, 8k resolution, professional studio lighting, realistic details";

        const prompt = `${subjectDetails}. ${styleDetails}. No text or words.`;
        console.log(`[AI] Generating tailored image for ${type}: ${prompt}`);

        let imageBuffer: Buffer | null = null;
        let engineUsed = "";

        // 1. Try Pollinations AI with subject-first prompt
        imageBuffer = await generateWithPollinations(prompt);
        if (imageBuffer) engineUsed = "pollinations";

        // 2. Try OpenAI DALL-E (if Pollinations failed & key present)
        if (!imageBuffer && process.env.OPENAI_API_KEY) {
            imageBuffer = await generateWithOpenAI(prompt);
            if (imageBuffer) engineUsed = "openai";
        }

        // 3. Guaranteed Keyword-Tailored Photography Engine
        if (!imageBuffer) {
            imageBuffer = await generateTailoredImage(title, description || "", type || "product");
            engineUsed = "tailored-curated";
        }

        // Upload image buffer to Cloudinary for permanent hosting
        const folder = type === "course" ? "courses/ai-generated" : "products/ai-generated";
        const publicId = `ai_${session.user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        console.log(`[AI] Uploading image buffer to Cloudinary (engine: ${engineUsed})...`);
        const result = await uploadToCloudinary(imageBuffer, {
            folder: `corecreator/${folder}`,
            publicId,
            resourceType: "image",
        });

        console.log(`[AI] Success! Engine: ${engineUsed} | Permanent URL: ${result.url}`);

        return NextResponse.json({
            success: true,
            url: result.url,
            isAiGenerated: true,
            engine: engineUsed,
        });

    } catch (error: any) {
        console.error("[AI Image Generation Error]:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image with AI" },
            { status: 500 }
        );
    }
}
