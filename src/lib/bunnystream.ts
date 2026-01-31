/**
 * Bunny Stream Integration
 * 
 * Bunny Stream provides affordable video hosting with:
 * - FREE encoding/transcoding
 * - Global CDN delivery
 * - HLS adaptive streaming
 * - Direct uploads up to 500MB
 * 
 * Environment Variables Required:
 * - BUNNY_STREAM_API_KEY: Your Stream API key
 * - BUNNY_STREAM_LIBRARY_ID: Your video library ID
 * - BUNNY_STREAM_CDN_HOSTNAME: Your CDN hostname (e.g., vz-xxxxx.b-cdn.net)
 */

const BUNNY_API_BASE = "https://video.bunnycdn.com";

interface BunnyVideoResponse {
    videoId: string;
    libraryId: number;
    title: string;
    status: number; // 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
    length: number;
    thumbnailFileName?: string;
    dateUploaded?: string;
    availableResolutions?: string; // e.g., "720p,360p"
    encodeProgress?: number;
}

interface CreateVideoOptions {
    title: string;
    collectionId?: string;
    thumbnailTime?: number; // Time in ms to use for thumbnail
}

/**
 * Create a new video entry in Bunny Stream
 */
export async function createBunnyVideo(options: CreateVideoOptions): Promise<BunnyVideoResponse> {
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

    if (!apiKey || !libraryId) {
        throw new Error("Bunny Stream credentials not configured");
    }

    const response = await fetch(
        `${BUNNY_API_BASE}/library/${libraryId}/videos`,
        {
            method: "POST",
            headers: {
                "AccessKey": apiKey,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(options),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create video: ${error}`);
    }

    return response.json();
}

/**
 * Upload video file to Bunny Stream
 */
export async function uploadBunnyVideo(
    videoId: string,
    fileBuffer: Buffer
): Promise<BunnyVideoResponse> {
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

    if (!apiKey || !libraryId) {
        throw new Error("Bunny Stream credentials not configured");
    }

    // Convert Buffer to Uint8Array for fetch compatibility
    const uint8Array = new Uint8Array(fileBuffer);

    const response = await fetch(
        `${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`,
        {
            method: "PUT",
            headers: {
                "AccessKey": apiKey,
                "Content-Type": "application/octet-stream",
            },
            body: uint8Array,
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload video: ${error}`);
    }

    return response.json();
}

/**
 * Get video status/details from Bunny Stream
 */
export async function getBunnyVideo(videoId: string): Promise<BunnyVideoResponse> {
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

    if (!apiKey || !libraryId) {
        throw new Error("Bunny Stream credentials not configured");
    }

    const response = await fetch(
        `${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`,
        {
            method: "GET",
            headers: {
                "AccessKey": apiKey,
                "Accept": "application/json",
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get video: ${error}`);
    }

    return response.json();
}

/**
 * Delete a video from Bunny Stream
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

    if (!apiKey || !libraryId) {
        throw new Error("Bunny Stream credentials not configured");
    }

    const response = await fetch(
        `${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`,
        {
            method: "DELETE",
            headers: {
                "AccessKey": apiKey,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete video: ${error}`);
    }
}

/**
 * Get the HLS streaming URL for a video
 */
export function getBunnyStreamUrl(videoId: string): string {
    const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;

    if (!cdnHostname) {
        throw new Error("Bunny Stream CDN hostname not configured");
    }

    // HLS playlist URL
    return `https://${cdnHostname}/${videoId}/playlist.m3u8`;
}

/**
 * Get the embed player URL for a video
 */
export function getBunnyEmbedUrl(videoId: string): string {
    const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

    if (!libraryId) {
        throw new Error("Bunny Stream library ID not configured");
    }

    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
}

/**
 * Get thumbnail URL for a video
 */
export function getBunnyThumbnailUrl(videoId: string): string {
    const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;

    if (!cdnHostname) {
        throw new Error("Bunny Stream CDN hostname not configured");
    }

    return `https://${cdnHostname}/${videoId}/thumbnail.jpg`;
}

/**
 * Video status codes
 */
export const BUNNY_VIDEO_STATUS = {
    CREATED: 0,
    UPLOADED: 1,
    PROCESSING: 2,
    TRANSCODING: 3,
    FINISHED: 4,
    ERROR: 5,
    CAPTIONS_QUEUED: 6,
} as const;
