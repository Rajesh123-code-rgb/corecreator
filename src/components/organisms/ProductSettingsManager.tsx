"use client";

import * as React from "react";
import {
    Eye,
    EyeOff,
    Globe,
    Search,
    Trash2,
    AlertTriangle,
    Info,
    Clock,
    XCircle,
    ShieldCheck
} from "lucide-react";
import { Button, Input, Textarea } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface ProductSettingsProps {
    settings: {
        status: "draft" | "pending" | "active" | "sold" | "archived" | "rejected";
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

    // Status display config — no direct publish allowed for creators
    const statusConfig: Record<string, {
        icon: React.ReactNode;
        label: string;
        description: string;
        color: string;
        bg: string;
    }> = {
        draft: {
            icon: <EyeOff className="w-5 h-5 text-gray-500" />,
            label: "Draft",
            description: "Only you can see this product. Submit it for admin review to make it live.",
            color: "text-gray-700",
            bg: "bg-gray-100",
        },
        pending: {
            icon: <Clock className="w-5 h-5 text-yellow-600" />,
            label: "Pending Review",
            description: "Your product is under admin review. You cannot edit it until reviewed.",
            color: "text-yellow-700",
            bg: "bg-yellow-100",
        },
        active: {
            icon: <Globe className="w-5 h-5 text-green-600" />,
            label: "Published",
            description: "Your product is live and visible to buyers on the marketplace.",
            color: "text-green-700",
            bg: "bg-green-100",
        },
        rejected: {
            icon: <XCircle className="w-5 h-5 text-red-600" />,
            label: "Rejected",
            description: "Admin has rejected this product. Review the feedback at the top of the page and resubmit.",
            color: "text-red-700",
            bg: "bg-red-100",
        },
        sold: {
            icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
            label: "Sold",
            description: "This product has been sold and is no longer available.",
            color: "text-blue-700",
            bg: "bg-blue-100",
        },
        archived: {
            icon: <EyeOff className="w-5 h-5 text-gray-400" />,
            label: "Archived",
            description: "This product is archived and not visible on the marketplace.",
            color: "text-gray-600",
            bg: "bg-gray-100",
        },
    };

    const currentStatus = statusConfig[settings.status] || statusConfig.draft;

    return (
        <div className="space-y-8">

            {/* Visibility / Status — Read-Only for Creators */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-600" />
                    Listing Status
                </h3>

                <div className="space-y-4">
                    {/* Current Status Display */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl ${currentStatus.bg}`}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/70">
                            {currentStatus.icon}
                        </div>
                        <div>
                            <p className={`font-semibold ${currentStatus.color}`}>{currentStatus.label}</p>
                            <p className={`text-sm opacity-80 ${currentStatus.color}`}>{currentStatus.description}</p>
                        </div>
                    </div>

                    {/* How-to publish guidance for draft / rejected */}
                    {(settings.status === "draft" || settings.status === "rejected") && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">How to publish your product</p>
                                <p className="text-sm text-amber-700 mt-1">
                                    All products must pass admin review before going live on the marketplace. Use the
                                    <span className="font-semibold"> "Submit for Approval"</span> button at the
                                    top of this page to send your product for review.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Pending-review note */}
                    {settings.status === "pending" && (
                        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-yellow-800">Review in Progress</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Our team is reviewing your submission. You will be notified once a decision is made.
                                    Editing is disabled while the product is pending.
                                </p>
                            </div>
                        </div>
                    )}
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
                                Are you sure you want to delete &quot;{productName}&quot;?
                            </p>
                            <p className="text-sm text-red-700">
                                This action is permanent and cannot be undone. All product data, images, and variants will be lost.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type &quot;DELETE&quot; to confirm
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

            {/* General Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                    Changes to settings are saved when you click &quot;Save Changes&quot; at the top of the page.
                </p>
            </div>
        </div>
    );
}
