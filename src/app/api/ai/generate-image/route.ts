import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { uploadToCloudinary } from "@/lib/cloudinary";

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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 503 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });


        // Construct a highly detailed prompt based on the type completely automatically
        const basePrompt = `Create an image for a ${type === 'course' ? 'professional e-learning course' : 'high-end e-commerce physical product'}.`;
        const stylingPrompt = type === 'course' 
            ? `It should be a clean, vibrant, and engaging course thumbnail banner (16:9 ratio style). Visuals should prominently represent the topic.`
            : `It should be a highly realistic, well-lit studio photography shot of the physical product resting on a clean pedestal or aesthetic background ready for an e-commerce store.`;
        
        const enhancedPrompt = `${basePrompt} Title: "${title}". Description: "${description || title}". ${stylingPrompt} NO TEXT or WORDS should be visible in the image. High definition, realistic, professional lighting.`;

        console.log(`[AI] Generating DALL-E image for ${type}: "${title}"`);

        // Generate the image using DALL-E 3
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt.substring(0, 4000), // OpenAI limit is 4000 chars
            n: 1,
            size: "1024x1024",
        });

        const dallEUrl = response?.data?.[0]?.url;

        if (!dallEUrl) {
            throw new Error("Failed to retrieve image URL from OpenAI");
        }

        console.log(`[AI] Image generated. Downloading from OpenAI to buffer...`);

        // Fetch the image from OpenAI's temporary URL so we can save it permanently
        const imageRes = await fetch(dallEUrl);
        if (!imageRes.ok) {
            throw new Error(`Failed to fetch image from OpenAI URL: ${imageRes.statusText}`);
        }

        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[AI] Uploading buffer to Cloudinary...`);

        // Define Cloudinary folder strategy
        const folder = type === 'course' ? 'courses/ai-generated' : 'products/ai-generated';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const publicId = `ai_${session.user.id}_${timestamp}_${randomString}`;

        const result = await uploadToCloudinary(buffer, {
            folder: `corecreator/${folder}`,
            publicId,
            resourceType: "image",
        });

        console.log(`[AI] Success! Permanent URL: ${result.url}`);

        return NextResponse.json({
            success: true,
            url: result.url,
            isAiGenerated: true
        });
        
    } catch (error: any) {
        console.error("[AI Image Generation Error]:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image with AI" },
            { status: 500 }
        );
    }
}
