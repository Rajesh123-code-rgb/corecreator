import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Helper fetch with AbortController timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
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
// Tier 1: Real OpenAI AI Image Generation (gpt-image-1, gpt-image-2, dall-e-3)
// ---------------------------------------------------------------------------
const OPENAI_IMAGE_MODELS = [
    "gpt-image-1",
    "gpt-image-2",
    "gpt-image-1.5",
    "chatgpt-image-latest",
    "dall-e-3",
    "dall-e-2",
];

async function generateWithOpenAI(prompt: string): Promise<Buffer | null> {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        for (const model of OPENAI_IMAGE_MODELS) {
            try {
                console.log(`[AI] Generating with OpenAI model: ${model}...`);
                const response = await openai.images.generate({
                    model,
                    prompt: prompt.substring(0, 4000),
                    n: 1,
                    size: "1024x1024",
                });

                const dataItem = response?.data?.[0];
                if (dataItem?.b64_json) {
                    console.log(`[AI] OpenAI model ${model} succeeded! (b64_json)`);
                    return Buffer.from(dataItem.b64_json, "base64");
                }
                if (dataItem?.url) {
                    console.log(`[AI] OpenAI model ${model} succeeded! (url)`);
                    const imgRes = await fetchWithTimeout(dataItem.url, {}, 10000);
                    if (imgRes.ok) {
                        return Buffer.from(await imgRes.arrayBuffer());
                    }
                }
            } catch (modelErr: any) {
                console.warn(`[AI] OpenAI model ${model} notice:`, modelErr?.message || modelErr);
            }
        }
    } catch (err: any) {
        console.warn("[AI] OpenAI client notice:", err?.message || err);
    }
    return null;
}

// ---------------------------------------------------------------------------
// Tier 2: Pollinations AI
// ---------------------------------------------------------------------------
async function generateWithPollinations(title: string, description: string, type: string): Promise<Buffer | null> {
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
// Tier 3: Score-Weighted Topic-Specific Photography Engine
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
        keywords: ["flower", "pressed", "floral", "petal", "rose", "botanical"],
        urls: [
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["wood", "carv", "sculpture", "wooden", "timber", "furniture", "elephant"],
        urls: [
            "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["paint", "oil", "canvas", "acrylic", "art", "portrait", "landscape"],
        urls: [
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["watercolo", "aquarelle", "wash"],
        urls: [
            "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["ceramic", "pottery", "clay", "vase", "bowl"],
        urls: [
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["jewel", "necklace", "ring", "earring", "pendant", "gold", "silver"],
        urls: [
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85",
        ],
    },
    {
        keywords: ["course", "masterclass", "learn", "tutorial", "workshop"],
        urls: [
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=85",
        ],
    },
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
        bestMatchUrl = type === "course"
            ? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85"
            : "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85";
    }

    console.log(`[AI] Topic fallback image for "${title}" -> ${bestMatchUrl}`);
    const res = await fetchWithTimeout(bestMatchUrl, {}, 8000);
    if (!res.ok) {
        throw new Error(`Failed to fetch topic image: ${res.statusText}`);
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

        const subjectDetails = description && description.trim().length > 3
            ? `"${title}" - ${description.trim()}`
            : `"${title}"`;

        const styleDetails = type === "course"
            ? "professional online course thumbnail banner, clear artistic visual representation, highly detailed"
            : "studio product photography, clean minimalist aesthetic background, 8k resolution, professional studio lighting, realistic details";

        const prompt = `${subjectDetails}. ${styleDetails}. No text or words.`;
        console.log(`[AI] Target prompt for ${type}: "${prompt}"`);

        let imageBuffer: Buffer | null = null;
        let engineUsed = "";

        // 1. Try Real OpenAI AI Image Generation (gpt-image-1, gpt-image-2, dall-e-3)
        if (process.env.OPENAI_API_KEY) {
            imageBuffer = await generateWithOpenAI(prompt);
            if (imageBuffer) engineUsed = "openai-gpt-image";
        }

        // 2. Try Pollinations AI if OpenAI unavailable
        if (!imageBuffer) {
            imageBuffer = await generateWithPollinations(title, description || "", type || "product");
            if (imageBuffer) engineUsed = "pollinations";
        }

        // 3. Fallback Topic Engine
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
