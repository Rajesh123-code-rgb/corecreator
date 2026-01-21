"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Image as ImageIcon,
    Settings,
    Palette,
    Box,
    Truck,
    Gift,
    ChevronLeft,
    Eye,
    Save,
    Loader2,
    Plus,
    Trash2,
    AlertTriangle,
    Check
} from "lucide-react";
import { Button, Input, Textarea } from "@/components/atoms";
import { Card } from "@/components/molecules";
import ProductMediaManager from "@/components/organisms/ProductMediaManager";
import ProductVariantManager from "@/components/organisms/ProductVariantManager";
import ProductCustomizationManager from "@/components/organisms/ProductCustomizationManager";
import ProductAddOnsManager from "@/components/organisms/ProductAddOnsManager";
import ProductShippingManager from "@/components/organisms/ProductShippingManager";
import ProductSettingsManager from "@/components/organisms/ProductSettingsManager";

// Types matching our schema
interface ProductData {
    id: string;
    name: string;
    description: string;
    productType: "physical" | "digital" | "service";
    price: number;
    compareAtPrice?: number;
    category: string;
    tags: string[];
    status: "draft" | "pending" | "active" | "sold" | "archived" | "rejected";
    isFeatured: boolean;
    metaTitle?: string;
    metaDescription?: string;
    currency: "USD" | "INR" | "EUR" | "GBP";
    sku?: string;
    quantity: number;
    trackInventory: boolean;
    images?: { url: string; isPrimary: boolean; alt?: string }[];
    variants?: any[];
    customizations?: any[];
    addOns?: any[];
    shipping?: {
        requiresShipping: boolean;
        weight?: number;
        width?: number;
        height?: number;
        depth?: number;
        processingTime?: string;
        shippingProfile?: string;
    };
    careInstructions?: string;
    bulkDiscounts?: {
        quantity: number;
        discountPercentage: number;
    }[];
    rejectionReason?: string;
}

const TABS = [
    { id: "basics", label: "Basics", icon: LayoutDashboard },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "variants", label: "Variants", icon: Box },
    { id: "customization", label: "Personalization", icon: Palette },
    { id: "addons", label: "Add-ons", icon: Gift },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function ProductEditPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState("basics");
    const [product, setProduct] = React.useState<ProductData | null>(null);
    const [productCategories, setProductCategories] = React.useState<{ _id: string; name: string; slug: string }[]>([]);

    // State for variants UX
    const [variantAttributes, setVariantAttributes] = React.useState<any[]>([]);

    // Fetch categories from database
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories?type=product");
                if (res.ok) {
                    const data = await res.json();
                    setProductCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    React.useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/studio/products/${params.id}`);
                const data = await res.json();
                if (data.product) {
                    setProduct({
                        ...data.product,
                        tags: data.product.tags || [],
                        id: data.product._id,
                        productType: data.product.productType || "physical",
                        status: data.product.status || "draft",
                        isFeatured: data.product.isFeatured || false,
                        metaTitle: data.product.metaTitle || "",
                        metaDescription: data.product.metaDescription || "",
                        currency: data.product.currency || "INR",
                        variants: data.product.variants || [],
                        customizations: data.product.customizations || [],
                        addOns: data.product.addOns || [],

                        shipping: data.product.shipping || { requiresShipping: true },
                        careInstructions: data.product.careInstructions || "",
                        bulkDiscounts: data.product.bulkDiscounts || []
                    });

                    // Note: We aren't reconstructing variantAttributes from DB yet as schema doesn't save them separately.
                    // In a real app we would infer them from variants or save them in a separate field.
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id]);

    const handleSave = async () => {
        if (!product) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/studio/products/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(product),
            });

            if (!res.ok) throw new Error("Failed to save");

            // Show toast/notification (placeholder)
            alert("Product saved successfully!");
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = (field: string, value: any) => {
        setProduct(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleDelete = async () => {
        if (!product) return;
        try {
            const res = await fetch(`/api/studio/products/${params.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            router.push("/studio/products");
        } catch (error) {
            console.error("Delete error:", error);
            throw error;
        }
    };

    const handleSubmitForReview = async () => {
        if (!confirm("Are you sure you want to submit this product for review? You won't be able to edit it while it's pending.")) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/studio/products/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "pending" })
            });

            if (res.ok) {
                const data = await res.json();
                setProduct(data.product);
                router.refresh();
            } else {
                throw new Error("Failed to submit");
            }
        } catch (error) {
            console.error("Submit Error:", error);
            alert("Failed to submit for review");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24">
            {/* Rejection Alert */}
            {product.status === "rejected" && product.rejectionReason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-900">Product Rejected</h3>
                        <p className="text-red-700 mt-1">{product.rejectionReason}</p>
                        <p className="text-sm text-red-600 mt-2">Please fix the issues above and resubmit for approval.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Products
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {product.name || "Untitled Product"}
                        </h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === "active" ? "bg-green-100 text-green-700" :
                            product.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                product.status === "rejected" ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-700"
                            }`}>
                            {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => window.open(`/marketplace/preview/${product.id}`, '_blank')}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                    </Button>
                    {(product.status === "draft" || product.status === "rejected") && (
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={handleSubmitForReview}
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            Submit for Approval
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-4 lg:pb-0 sticky top-24">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "text-gray-600 hover:bg-gray-50"}`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-amber-600" : "text-gray-400"}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* BASICS TAB */}
                    {activeTab === "basics" && (
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <LayoutDashboard className="w-5 h-5 text-amber-500" />
                                    Product Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                                        <Input
                                            value={product.name}
                                            onChange={(e) => handleUpdate("name", e.target.value)}
                                            placeholder="e.g. Sunset Resin Art Wall Clock"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <Textarea
                                            value={product.description}
                                            onChange={(e) => handleUpdate("description", e.target.value)}
                                            rows={8}
                                            placeholder="Describe your artwork, materials used, inspiration..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
                                        <Textarea
                                            value={product.careInstructions || ""}
                                            onChange={(e) => handleUpdate("careInstructions", e.target.value)}
                                            rows={4}
                                            placeholder="e.g. Wipe with damp cloth, avoid direct sunlight..."
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <Box className="w-5 h-5 text-amber-500" />
                                    Categorization
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                            value={product.category}
                                            onChange={(e) => handleUpdate("category", e.target.value)}
                                        >
                                            <option value="">Select Category</option>
                                            {productCategories.map((cat) => (
                                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                        <Input
                                            value={product.tags.join(", ")}
                                            onChange={(e) => handleUpdate("tags", e.target.value.split(",").map(t => t.trim()))}
                                            placeholder="abstract, nature, blue..."
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <span className="text-lg font-bold select-none text-amber-500">$</span>
                                    Pricing & Inventory
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Currency Selector */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                        <div className="flex gap-2">
                                            {[
                                                { code: "USD", symbol: "$", label: "US Dollar" },
                                                { code: "INR", symbol: "₹", label: "Indian Rupee" },
                                                { code: "EUR", symbol: "€", label: "Euro" },
                                                { code: "GBP", symbol: "£", label: "British Pound" }
                                            ].map((curr) => (
                                                <button
                                                    key={curr.code}
                                                    type="button"
                                                    onClick={() => handleUpdate("currency", curr.code)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${product.currency === curr.code
                                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                                        : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                >
                                                    <span className="text-lg font-semibold">{curr.symbol}</span>
                                                    <span className="text-sm">{curr.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Base Price ({product.currency === "USD" ? "$" : product.currency === "INR" ? "₹" : product.currency === "EUR" ? "€" : "£"})
                                        </label>
                                        <Input
                                            type="number"
                                            value={product.price}
                                            onChange={(e) => handleUpdate("price", parseFloat(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Compare Price ({product.currency === "USD" ? "$" : product.currency === "INR" ? "₹" : product.currency === "EUR" ? "€" : "£"})
                                        </label>
                                        <Input
                                            type="number"
                                            value={product.compareAtPrice || ""}
                                            onChange={(e) => handleUpdate("compareAtPrice", parseFloat(e.target.value))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
                                        <Input
                                            value={product.sku || ""}
                                            onChange={(e) => handleUpdate("sku", e.target.value)}
                                            placeholder="e.g. RES-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                        <Input
                                            type="number"
                                            value={product.quantity}
                                            onChange={(e) => handleUpdate("quantity", parseInt(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <span className="text-lg font-bold select-none text-amber-500">%</span>
                                    Bulk Order Discounts
                                </h3>
                                {(product.bulkDiscounts || []).map((discount, index) => (
                                    <div key={index} className="flex gap-4 mb-3 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">Min. Quantity</label>
                                            <Input
                                                type="number"
                                                value={discount.quantity}
                                                onChange={(e) => {
                                                    const newDiscounts = [...(product.bulkDiscounts || [])];
                                                    newDiscounts[index].quantity = parseInt(e.target.value);
                                                    handleUpdate("bulkDiscounts", newDiscounts);
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 mb-1">Discount %</label>
                                            <Input
                                                type="number"
                                                value={discount.discountPercentage}
                                                onChange={(e) => {
                                                    const newDiscounts = [...(product.bulkDiscounts || [])];
                                                    newDiscounts[index].discountPercentage = parseFloat(e.target.value);
                                                    handleUpdate("bulkDiscounts", newDiscounts);
                                                }}
                                            />
                                        </div>
                                        <Button variant="ghost" onClick={() => {
                                            const newDiscounts = [...(product.bulkDiscounts || [])];
                                            newDiscounts.splice(index, 1);
                                            handleUpdate("bulkDiscounts", newDiscounts);
                                        }} className="text-red-500 mb-0.5">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => {
                                    handleUpdate("bulkDiscounts", [...(product.bulkDiscounts || []), { quantity: 2, discountPercentage: 5 }]);
                                }}>
                                    <Plus className="w-4 h-4 mr-1" /> Add Discount Tier
                                </Button>
                            </Card>
                        </div>
                    )}

                    {/* MEDIA TAB */}
                    {activeTab === "media" && (
                        <ProductMediaManager
                            images={product.images || []}
                            onChange={(images) => handleUpdate("images", images)}
                        />
                    )}

                    {/* VARIANTS TAB */}
                    {activeTab === "variants" && (
                        <ProductVariantManager
                            basePrice={product.price}
                            variants={product.variants || []}
                            attributes={variantAttributes}
                            onChange={(variants, attributes) => {
                                handleUpdate("variants", variants);
                                setVariantAttributes(attributes);
                            }}
                        />
                    )}

                    {/* PERSONALIZATION TAB */}
                    {activeTab === "customization" && (
                        <ProductCustomizationManager
                            customizations={product.customizations || []}
                            onChange={(customizations) => handleUpdate("customizations", customizations)}
                        />
                    )}

                    {/* ADD-ONS TAB */}
                    {activeTab === "addons" && (
                        <ProductAddOnsManager
                            addOns={product.addOns || []}
                            onChange={(addOns) => handleUpdate("addOns", addOns)}
                        />
                    )}

                    {/* SHIPPING TAB */}
                    {activeTab === "shipping" && (
                        <ProductShippingManager
                            shipping={product.shipping || { requiresShipping: true }}
                            productType={product.productType}
                            onChange={(shipping) => handleUpdate("shipping", shipping)}
                        />
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === "settings" && (
                        <ProductSettingsManager
                            settings={{
                                status: product.status as any,
                                isFeatured: product.isFeatured,
                                metaTitle: product.metaTitle,
                                metaDescription: product.metaDescription
                            }}
                            productName={product.name}
                            onChange={(settings) => {
                                setProduct(prev => prev ? ({
                                    ...prev,
                                    status: settings.status,
                                    isFeatured: settings.isFeatured,
                                    metaTitle: settings.metaTitle,
                                    metaDescription: settings.metaDescription
                                }) : null);
                            }}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div >
        </div >
    );
}
