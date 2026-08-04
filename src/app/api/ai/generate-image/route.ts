import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ---------------------------------------------------------------------------
// Pollinations AI API – Supports gpt-image-1, gpt-image-2, flux, turbo
// Free, fast, high-quality, no API key required
// ---------------------------------------------------------------------------
const POLLINATIONS_MODELS = ["gpt-image-1", "gpt-image-2", "flux", "turbo"];

async function generateWithPollinations(prompt: string): Promise<Buffer> {
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);

    for (const model of POLLINATIONS_MODELS) {
        try {
            console.log(`[AI] Trying Pollinations model: ${model}`);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=1024&height=1024&nologo=true&seed=${seed}`;

            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            });

            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                // Ensure we received a valid image (> 5KB)
                if (buffer.length > 5000) {
                    console.log(`[AI] Pollinations model ${model} succeeded! (${buffer.length} bytes)`);
                    return buffer;
                }
            } else {
                console.warn(`[AI] Pollinations model ${model} returned HTTP ${res.status}`);
            }
        } catch (err) {
            console.warn(`[AI] Pollinations model ${model} error:`, err);
        }
    }

    throw new Error("Pollinations AI models (gpt-image-1, gpt-image-2, flux) were unavailable.");
}

// ---------------------------------------------------------------------------
// Hugging Face Inference API – Secondary fallback
// ---------------------------------------------------------------------------
const HF_MODELS = [
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5",
];

async function generateWithHuggingFace(prompt: string): Promise<Buffer> {
    const hfToken = process.env.HUGGINGFACE_API_KEY;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {}),
    };

    for (const model of HF_MODELS) {
        console.log(`[AI] Trying Hugging Face model: ${model}`);
        try {
            const res = await fetch(
                `https://api-inference.huggingface.co/models/${model}`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            num_inference_steps: 30,
                            guidance_scale: 7.5,
                            width: 1024,
                            height: 1024,
                        },
                        options: { wait_for_model: true },
                    }),
                }
            );

            if (!res.ok) {
                continue;
            }

            const contentType = res.headers.get("content-type") || "";
            if (!contentType.startsWith("image/")) {
                const json = await res.json();
                if (json?.error) continue;
            }

            const arrayBuffer = await res.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (err) {
            console.warn(`[AI] HF model ${model} threw:`, err);
        }
    }

    throw new Error("Hugging Face models unavailable.");
}

// ---------------------------------------------------------------------------
// OpenAI DALL-E – Optional fallback
// ---------------------------------------------------------------------------
async function generateWithOpenAI(prompt: string): Promise<Buffer> {
    if (!process.env.OPENAI_API_KEY) throw new Error("No OpenAI key");
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    for (const model of ["dall-e-3", "dall-e-2"] as const) {
        try {
            console.log(`[AI] Trying OpenAI model: ${model}`);
            const response = await openai.images.generate({
                model,
                prompt: prompt.substring(0, model === "dall-e-3" ? 4000 : 1000),
                n: 1,
                size: "1024x1024",
            });
            const url = response?.data?.[0]?.url;
            if (!url) throw new Error("No URL returned");

            const imgRes = await fetch(url);
            if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.statusText}`);
            return Buffer.from(await imgRes.arrayBuffer());
        } catch (err: any) {
            console.warn(`[AI] OpenAI ${model} failed:`, err?.message);
        }
    }
    throw new Error("OpenAI image models unavailable.");
}

// ---------------------------------------------------------------------------
// Route handler
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

        // Build prompt
        const basePrompt = `Create an image for a ${type === "course"
            ? "professional e-learning course"
            : "high-end e-commerce physical product"}.`;
        const stylingPrompt = type === "course"
            ? "Clean, vibrant, engaging course thumbnail. Visuals represent the topic strongly. No text."
            : "Highly realistic studio photography of the product on a clean aesthetic background. No text.";
        const prompt = `${basePrompt} Title: "${title}". Description: "${description || title}". ${stylingPrompt} Professional lighting, high definition.`;

        let imageBuffer: Buffer | null = null;
        let engineUsed = "";

        // 1. Try Pollinations (gpt-image-1, gpt-image-2, flux)
        try {
            imageBuffer = await generateWithPollinations(prompt);
            engineUsed = "gpt-image";
        } catch (e1: any) {
            console.warn("[AI] Pollinations failed, trying Hugging Face:", e1.message);
        }

        // 2. Try Hugging Face
        if (!imageBuffer) {
            try {
                imageBuffer = await generateWithHuggingFace(prompt);
                engineUsed = "huggingface";
            } catch (e2: any) {
                console.warn("[AI] Hugging Face failed, trying OpenAI:", e2.message);
            }
        }

        // 3. Try OpenAI as last resort
        if (!imageBuffer && process.env.OPENAI_API_KEY) {
            try {
                imageBuffer = await generateWithOpenAI(prompt);
                engineUsed = "openai";
            } catch (e3: any) {
                console.warn("[AI] OpenAI failed:", e3.message);
            }
        }

        if (!imageBuffer) {
            throw new Error("Unable to generate image. Please try again in a few moments.");
        }

        // Upload to Cloudinary for a permanent URL
        const folder = type === "course" ? "courses/ai-generated" : "products/ai-generated";
        const publicId = `ai_${session.user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        console.log(`[AI] Uploading to Cloudinary (engine: ${engineUsed})...`);
        const result = await uploadToCloudinary(imageBuffer, {
            folder: `corecreator/${folder}`,
            publicId,
            resourceType: "image",
        });

        console.log(`[AI] Done! Engine: ${engineUsed} | URL: ${result.url}`);

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
