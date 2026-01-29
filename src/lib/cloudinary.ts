import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    url: string;
    publicId: string;
    format: string;
    size: number;
}

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer to upload
 * @param options - Upload options
 * @returns Upload result with URL and metadata
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    options: {
        folder: string;
        publicId?: string;
        resourceType?: 'image' | 'raw' | 'auto';
    }
): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder,
                public_id: options.publicId,
                resource_type: options.resourceType || 'auto',
                // Allow PDF and images
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        format: result.format,
                        size: result.bytes,
                    });
                } else {
                    reject(new Error('Upload failed with no result'));
                }
            }
        );

        // Write buffer to stream
        uploadStream.end(buffer);
    });
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The resource type (image, raw, etc.)
 */
export async function deleteFromCloudinary(
    publicId: string,
    resourceType: 'image' | 'raw' = 'image'
): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default cloudinary;
