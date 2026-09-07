/**
 * OpenAI image generation, shared between the creator-facing
 * /api/ai/generate-image route and the admin category image backfill.
 *
 * Lifted out of the route so the second caller does not need a second copy of
 * the model-fallback loop. Behaviour is unchanged: try each model in turn and
 * return the first buffer produced, or null if none of them answer.
 */

/** fetch with a hard timeout, so a hung image URL cannot stall a request. */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 12000
): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
}

/**
 * Models are tried in order. Accounts differ in what they are entitled to, and
 * an unavailable model returns an error rather than falling back on its own, so
 * the list walks from newest to oldest until one answers.
 */
export const OPENAI_IMAGE_MODELS = [
    "gpt-image-1",
    "gpt-image-2",
    "gpt-image-1.5",
    "chatgpt-image-latest",
    "dall-e-3",
    "dall-e-2",
];

export async function generateWithOpenAI(prompt: string): Promise<Buffer | null> {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        for (const model of OPENAI_IMAGE_MODELS) {
            try {
                const response = await openai.images.generate({
                    model,
                    prompt: prompt.substring(0, 4000),
                    n: 1,
                    size: "1024x1024",
                });

                const dataItem = response?.data?.[0];
                if (dataItem?.b64_json) {
                    return Buffer.from(dataItem.b64_json, "base64");
                }
                if (dataItem?.url) {
                    const imgRes = await fetchWithTimeout(dataItem.url, {}, 10000);
                    if (imgRes.ok) return Buffer.from(await imgRes.arrayBuffer());
                }
            } catch (modelErr) {
                console.warn(`[AI] model ${model}:`, (modelErr as Error)?.message || modelErr);
            }
        }
    } catch (err) {
        console.warn("[AI] OpenAI client:", (err as Error)?.message || err);
    }
    return null;
}

/**
 * Prompt for an art-form category tile.
 *
 * Deliberately describes materials, technique and finished objects, and rules
 * out people, faces and ceremonial content. Several of these forms - Aboriginal
 * dot painting, Huichol beadwork, totem carving, pysanka - carry designs with
 * specific meaning to living communities, and a generated image that drifts
 * into imitating those is not a neutral mistake. Asking for the craft rather
 * than the iconography keeps the tile useful without going there.
 */
export function artFormImagePrompt(name: string, description: string): string {
    return [
        `A single photographic still life representing the craft "${name}".`,
        description,
        "Show the materials, tools and finished handmade objects of the craft.",
        "Neutral studio background, soft natural lighting, shallow depth of field,",
        "square composition, photorealistic, richly coloured.",
        "No people, no faces, no hands, no text or lettering, no logos,",
        "no religious, sacred or ceremonial imagery, no flags.",
    ]
        .filter(Boolean)
        .join(" ");
}
