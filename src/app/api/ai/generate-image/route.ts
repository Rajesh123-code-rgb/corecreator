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
// Extensive Weighted Keyword Topic-to-Image Library
// Maps exact keywords in title & description to topic-specific photography
// ---------------------------------------------------------------------------
interface TopicMapping {
    keywords: string[];
    urls: string[];
}

const ART_CRAFT_TOPICS: TopicMapping[] = [
    {
        keywords: ["resin", "epoxy", "coaster", "botanical", "pressed flower"],
        urls: [
            "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["flower", "pressed", "floral", "petal", "rose", "botanical", "herb"],
        urls: [
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["wood", "carv", "sculpture", "wooden", "timber", "furniture", "elephant", "statue"],
        urls: [
            "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["paint", "oil", "canvas", "acrylic", "art", "portrait", "landscape", "sketch", "drawing"],
        urls: [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["watercolo", "aquarelle", "wash", "pigment"],
        urls: [
            "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["ceramic", "pottery", "clay", "vase", "bowl", "terracotta"],
        urls: [
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["jewel", "necklace", "ring", "earring", "pendant", "gold", "silver", "kundan", "pearl"],
        urls: [
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["digital", "illustrat", "procreate", "photoshop", "vector", "design", "3d", "animation"],
        urls: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["fabric", "textile", "embroider", "weave", "thread", "yarn", "macrame", "saree", "silk"],
        urls: [
            "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["course", "masterclass", "learn", "tutorial", "workshop", "class", "study", "book"],
        urls: [
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=1200&q=85",
        ],
    },
];

const DEFAULT_PRODUCT_FALLBACKS = [
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
];

const DEFAULT_COURSE_FALLBACKS = [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
];

async function generateTailoredTopicImage(title: string, description: string, type: string): Promise<Buffer> {
    const fullText = `${title} ${description || ''}`.toLowerCase();

    let bestMatchUrl: string | null = null;
    let maxScore = 0;

    for (const item of ART_CRAFT_TOPICS) {
        let score = 0;
        for (const kw of item.keywords) {
            if (fullText.includes(kw)) {
                score += kw.length;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            const hash = Array.from(fullText).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            bestMatchUrl = item.urls[Math.abs(hash) % item.urls.length];
        }
    }

    if (!bestMatchUrl) {
        const pool = type === "course" ? DEFAULT_COURSE_FALLBACKS : DEFAULT_PRODUCT_FALLBACKS;
        let hash = Date.now();
        for (let i = 0; i < title.length; i++) {
            hash = (hash << 5) - hash + title.charCodeAt(i);
            hash |= 0;
        }
        bestMatchUrl = pool[Math.abs(hash) % pool.length];
    }

    console.log(`[AI] Selected topic image for "${title}" -> ${bestMatchUrl}`);
    const res = await fetchWithTimeout(bestMatchUrl, {}, 8000);
    if (!res.ok) {
        throw new Error(`Failed to fetch topic image: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Pollinations AI – Attempts generation with clean prompt & 6s timeout
// ---------------------------------------------------------------------------
async function generateWithPollinations(title: string, description: string, type: string): Promise<Buffer | null> {
    // Alphanumeric clean prompt to avoid query parsing errors
    const rawPrompt = `${title} ${description || ''} ${type === 'course' ? 'course banner' : 'product photography'}`;
    const cleanPrompt = rawPrompt.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const encoded = encodeURIComponent(cleanPrompt.substring(0, 200));
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encoded}?nologo=true&seed=${seed}`;

    try {
        console.log(`[AI] Trying Pollinations AI with prompt: "${cleanPrompt}"`);
        const res = await fetchWithTimeout(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        }, 6000);

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

        let imageBuffer: Buffer | null = null;
        let engineUsed = "";

        // 1. Try Pollinations AI first with clean title & description prompt
        imageBuffer = await generateWithPollinations(title, description || "", type || "product");
        if (imageBuffer) engineUsed = "pollinations";

        // 2. High-Precision Score-Weighted Keyword Topic Engine
        if (!imageBuffer) {
            imageBuffer = await generateTailoredTopicImage(title, description || "", type || "product");
            engineUsed = "tailored-topic";
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
