"use client";

import * as React from "react";
import {
    Eye,
    EyeOff,
    Globe,
    Search,
    Trash2,
    AlertTriangle,
    Check,
    Info
} from "lucide-react";
import { Button, Input, Textarea } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface ProductSettingsProps {
    settings: {
        status: "draft" | "pending" | "active" | "sold" | "archived";
        isFeatured: boolean;
        metaTitle?: string;
        metaDescription?: string;
    };
    productName: string;
    onChange: (settings: ProductSettingsProps["settings"]) => void;
    onDelete: () => Promise<void>;
}

export default function ProductSettingsManager({
    settings,
    productName,
    onChange,
    onDelete
}: ProductSettingsProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleUpdate = <K extends keyof ProductSettingsProps["settings"]>(
        key: K,
        value: ProductSettingsProps["settings"][K]
    ) => {
        onChange({ ...settings, [key]: value });
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== "DELETE") return;
        setIsDeleting(true);
        try {
            await onDelete();
        } catch (error) {
            setIsDeleting(false);
        }
    };

    const togglePublish = () => {
        const newStatus = settings.status === "active" ? "draft" : "active";
        handleUpdate("status", newStatus);
    };

    return (
        <div className="space-y-8">
            {/* Visibility Section */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-600" />
                    Visibility
                </h3>

                <div className="space-y-4">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            {settings.status === "active" ? (
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-green-600" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <EyeOff className="w-5 h-5 text-gray-500" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium">
                                    {settings.status === "active" ? "Published" : "Draft"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {settings.status === "active"
                                        ? "Your product is visible to buyers"
                                        : "Only you can see this product"}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={togglePublish}
                            variant={settings.status === "active" ? "outline" : "secondary"}
                        >
                            {settings.status === "active" ? "Unpublish" : "Publish Now"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* SEO Section */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-600" />
                    Search Engine Optimization (SEO)
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meta Title
                        </label>
                        <Input
                            value={settings.metaTitle || ""}
                            onChange={(e) => handleUpdate("metaTitle", e.target.value)}
                            placeholder={productName}
                            maxLength={60}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {(settings.metaTitle || "").length}/60 characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meta Description
                        </label>
                        <Textarea
                            value={settings.metaDescription || ""}
                            onChange={(e) => handleUpdate("metaDescription", e.target.value)}
                            placeholder="Brief description for search engines..."
                            rows={3}
                            maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {(settings.metaDescription || "").length}/160 characters
                        </p>
                    </div>

                    {/* SEO Preview */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Search Preview</p>
                        <p className="text-blue-600 font-medium truncate">
                            {settings.metaTitle || productName || "Product Title"}
                        </p>
                        <p className="text-green-700 text-sm">
                            corecreator.com › marketplace › product
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {settings.metaDescription || "Product description will appear here..."}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-200 bg-red-50/30">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                </h3>

                {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Delete this product</p>
                            <p className="text-sm text-gray-500">
                                Once deleted, this product cannot be recovered
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Product
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
                            <p className="text-red-800 font-medium mb-2">
                                Are you sure you want to delete "{productName}"?
                            </p>
                            <p className="text-sm text-red-700">
                                This action is permanent and cannot be undone. All product data, images, and variants will be lost.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type "DELETE" to confirm
                            </label>
                            <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                placeholder="DELETE"
                                className="max-w-xs"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleDelete}
                                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? "Deleting..." : "Delete Forever"}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Info Note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                    Changes to settings are saved automatically when you click "Save Changes" at the top of the page.
                </p>
            </div>
        </div>
    );
}
