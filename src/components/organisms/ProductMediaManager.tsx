"use client";

import * as React from "react";
import { Upload, X, Star, Image as ImageIcon, Trash2, Plus, Camera } from "lucide-react";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface ProductImage {
    url: string;
    alt?: string;
    isPrimary: boolean;
}

interface ProductMediaManagerProps {
    images: ProductImage[];
    onChange: (images: ProductImage[]) => void;
}

export default function ProductMediaManager({ images, onChange }: ProductMediaManagerProps) {
    const featuredInputRef = React.useRef<HTMLInputElement>(null);
    const galleryInputRef = React.useRef<HTMLInputElement>(null);

    // Get featured (primary) image
    const featuredImage = images.find(img => img.isPrimary);
    const galleryImages = images.filter(img => !img.isPrimary);

    const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newImage: ProductImage = {
                url: URL.createObjectURL(file),
                isPrimary: true,
                alt: file.name
            };

            // Replace existing primary or add as primary
            const updatedImages = images.filter(img => !img.isPrimary);
            onChange([newImage, ...updatedImages]);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newImages: ProductImage[] = Array.from(e.target.files).map(file => ({
                url: URL.createObjectURL(file),
                isPrimary: false,
                alt: file.name
            }));

            onChange([...images, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        const allImages = [featuredImage, ...galleryImages].filter(Boolean) as ProductImage[];
        const targetImage = allImages[index];

        if (!targetImage) return;

        const newImages = images.filter(img => img.url !== targetImage.url);

        // If we removed the featured image, make the first gallery image the featured
        if (targetImage.isPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true;
        }

        onChange(newImages);
    };

    const promoteToFeatured = (galleryIndex: number) => {
        const targetImage = galleryImages[galleryIndex];
        if (!targetImage) return;

        const newImages = images.map(img => ({
            ...img,
            isPrimary: img.url === targetImage.url
        }));
        onChange(newImages);
    };

    return (
        <div className="space-y-6">
            {/* Section 1: Featured Image */}
            <Card className="p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        Featured Image
                    </h3>
                    <p className="text-sm text-gray-500">
                        This is the main image that appears in search results and your product card
                    </p>
                </div>

                {featuredImage ? (
                    <div className="relative group">
                        <div className="aspect-[4/3] max-w-md bg-gray-100 rounded-xl overflow-hidden border-2 border-amber-200">
                            <img
                                src={featuredImage.url}
                                alt={featuredImage.alt || "Featured"}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Overlay actions */}
                        <div className="absolute inset-0 max-w-md bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => featuredInputRef.current?.click()}
                            >
                                <Camera className="w-4 h-4 mr-2" /> Replace
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeImage(0)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Badge */}
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                            Featured
                        </div>
                    </div>
                ) : (
                    <div
                        className="aspect-[4/3] max-w-md border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                        onClick={() => featuredInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-medium text-gray-700">Upload Featured Image</p>
                        <p className="text-sm text-gray-500 mt-1">Recommended: 1200 x 900px</p>
                    </div>
                )}

                <input
                    type="file"
                    ref={featuredInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFeaturedUpload}
                />
            </Card>

            {/* Section 2: Product Gallery */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-amber-500" />
                            Product Gallery
                        </h3>
                        <p className="text-sm text-gray-500">
                            Additional images showing different angles, details, or usage
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => galleryInputRef.current?.click()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Images
                    </Button>
                </div>

                {galleryImages.length === 0 ? (
                    <div
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                        onClick={() => galleryInputRef.current?.click()}
                    >
                        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-700">Add gallery images</p>
                        <p className="text-sm text-gray-500 mt-1">Show different angles and details</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {galleryImages.map((image, i) => (
                            <div
                                key={i}
                                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-amber-300 transition-colors"
                            >
                                <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs px-2"
                                        onClick={() => promoteToFeatured(i)}
                                    >
                                        <Star className="w-3 h-3 mr-1" /> Make Featured
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-7 w-7 p-0"
                                        onClick={() => removeImage(i + 1)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Add more button */}
                        <div
                            className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                            onClick={() => galleryInputRef.current?.click()}
                        >
                            <Plus className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1">Add More</span>
                        </div>
                    </div>
                )}

                <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                />

                {/* Tips */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Pro Tips:</strong> High-quality images increase sales by 40%. Include close-ups, lifestyle shots, and size references.
                    </p>
                </div>
            </Card>
        </div>
    );
}
