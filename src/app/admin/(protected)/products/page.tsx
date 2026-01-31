"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Check,
    X,
    Star,
    Download,
    ChevronLeft,
    ChevronRight,
    Package,
    DollarSign,
    TrendingUp,
    AlertCircle,
    Loader2,
    Plus,
    ShieldOff,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/atoms";
import { useCurrency } from "@/context/CurrencyContext";
import { useConfirmModal, useToast } from "@/components/molecules";

interface Product {
    _id: string;
    name: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    productType?: "physical" | "digital" | "service";
    seller?: { _id: string; name: string; email?: string; studioProfile?: { name?: string } };
    sellerName?: string;
    category: string;
    subcategory?: string;
    tags?: string[];
    price: number;
    compareAtPrice?: number;
    currency?: string;
    status: string;
    quantity: number;
    sku?: string;
    trackInventory?: boolean;
    lowStockThreshold?: number;
    hasVariants?: boolean;
    variants?: { id: string; attributes: { name: string; value: string }[]; price: number; stock: number; sku?: string }[];
    images?: string[];
    videoUrl?: string;
    shipping?: {
        weight?: number;
        width?: number;
        height?: number;
        depth?: number;
        requiresShipping?: boolean;
        processingTime?: string;
    };
    artworkDetails?: {
        medium?: string;
        style?: string;
        subject?: string;
        orientation?: string;
        yearCreated?: number;
        isOriginal?: boolean;
        isFramed?: boolean;
    };
    averageRating?: number;
    rating?: number;
    reviewCount?: number;
    views?: number;
    favorites?: number;
    salesCount?: number;
    isFeatured?: boolean;
    careInstructions?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt?: string;
    publishedAt?: string;
    submittedAt?: string;
    reviewedAt?: string;
}

export default function AdminProductsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedStatus, setSelectedStatus] = React.useState("all");
    const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [stats, setStats] = React.useState({ total: 0, active: 0, pending: 0, totalValue: 0 });
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [exportLoading, setExportLoading] = React.useState(false);

    // Action States
    const [viewProduct, setViewProduct] = React.useState<Product | null>(null);
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; right: number } | null>(null);
    const [rejectModal, setRejectModal] = React.useState<{ isOpen: boolean; productId: string | null; reason: string }>({ isOpen: false, productId: null, reason: "" });
    const confirmModal = useConfirmModal();
    const toast = useToast();

    const handleAction = async (id: string, action: "approve" | "reject" | "delete" | "block" | "unblock", reason?: string) => {
        setActionLoading(id);
        try {
            let res;
            if (action === "delete") {
                res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
            } else {
                let status: string;
                if (action === "approve" || action === "unblock") {
                    status = "active";
                } else if (action === "block") {
                    status = "blocked";
                } else {
                    status = "rejected";
                }
                const body: any = { status };
                if (action === "reject") {
                    body.rejectionReason = reason;
                }

                res = await fetch(`/api/admin/products/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
            }

            if (res.ok) {
                // Refresh list
                await fetchProducts();
                setActiveDropdown(null);
                setRejectModal({ isOpen: false, productId: null, reason: "" });
            } else {
                const data = await res.json();
                toast.error(data.error || "Action failed");
            }
        } catch (error) {
            console.error("Action error:", error);
            toast.error("An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    // Check for ?create=true query parameter
    React.useEffect(() => {
        if (searchParams.get("create") === "true") {
            setShowCreateModal(true);
            // Clear the query param from URL
            router.replace("/admin/products", { scroll: false });
        }
    }, [searchParams, router]);

    const fetchProducts = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            });
            if (searchQuery) params.set("search", searchQuery);
            if (selectedStatus !== "all") params.set("status", selectedStatus);

            const res = await fetch(`/api/admin/products?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
                setTotalPages(data.pagination?.pages || 1);

                // Calculate stats
                const active = (data.products || []).filter((p: Product) => p.status === "published" || p.status === "active").length;
                const pending = (data.products || []).filter((p: Product) => p.status === "pending").length;
                const totalValue = (data.products || []).reduce((sum: number, p: Product) => sum + (p.price || 0), 0);
                setStats({ total: data.pagination?.total || 0, active, pending, totalValue });
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, selectedStatus]);

    React.useEffect(() => {
        const timer = setTimeout(() => { fetchProducts(); }, 300);
        return () => clearTimeout(timer);
    }, [fetchProducts]);

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            if (selectedStatus !== "all") params.set("status", selectedStatus);
            params.set("all", "true"); // Fetch all for export

            const res = await fetch(`/api/admin/products?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch export data");

            const data = await res.json();
            const productsToExport = data.products || [];

            // Convert to CSV
            const headers = ["Product ID", "Name", "Category", "Price", "Status", "Seller", "Created At"];
            const csvContent = [
                headers.join(","),
                ...productsToExport.map((p: Product) => [
                    p._id,
                    `"${p.name.replace(/"/g, '""')}"`,
                    p.category,
                    p.price,
                    p.status,
                    `"${(p.sellerName || p.seller?.name || "Unknown").replace(/"/g, '""')}"`,
                    new Date(p.createdAt).toLocaleDateString()
                ].join(","))
            ].join("\n");

            // Download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export products");
        } finally {
            setExportLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            published: "bg-green-100 text-green-700",
            active: "bg-green-100 text-green-700",
            pending: "bg-yellow-100 text-yellow-700",
            rejected: "bg-red-100 text-red-700",
            blocked: "bg-red-100 text-red-700",
            draft: "bg-gray-100 text-gray-700"
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                    <p className="text-gray-500 mt-1">Manage marketplace listings and approvals</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading}>
                    {exportLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Export
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Products</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                            <p className="text-sm text-gray-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            <p className="text-sm text-gray-500">Pending Approval</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalValue)}</p>
                            <p className="text-sm text-gray-500">Total Value</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Alert */}
            {stats.pending > 0 && (
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-yellow-800">
                        <strong>{stats.pending} product(s)</strong> pending approval
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setSelectedStatus("pending")}>
                        Review All
                    </Button>
                </div>
            )}

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search products or sellers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {["all", "published", "pending", "blocked", "draft"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedStatus(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === s
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator (ID)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-900">{product.seller?.name || product.sellerName || "Unknown"}</p>
                                                <p className="text-xs text-gray-400 font-mono">{product.seller?._id?.slice(-8) || "—"}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                                        <td className="px-6 py-4 font-medium">{formatPrice(product.price)}</td>
                                        <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                                        <td className="px-6 py-4">
                                            {product.averageRating && product.averageRating > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm">{product.averageRating.toFixed(1)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1 relative">
                                                {product.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => confirmModal.confirm({
                                                                title: "Approve Product",
                                                                message: "Approve this product for the marketplace?",
                                                                confirmText: "Approve",
                                                                variant: "info",
                                                                onConfirm: () => handleAction(product._id, "approve"),
                                                            })}
                                                            disabled={!!actionLoading}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            {actionLoading === product._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectModal({ isOpen: true, productId: product._id, reason: "" })}
                                                            disabled={!!actionLoading}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            {actionLoading === product._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setViewProduct(product)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(activeDropdown === product._id ? null : product._id);
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPosition({
                                                                top: rect.bottom + 5,
                                                                right: window.innerWidth - rect.right
                                                            });
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${activeDropdown === product._id ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dropdown Overlay & Menu */}
            {activeDropdown && dropdownPosition && (() => {
                const product = products.find(p => p._id === activeDropdown);
                if (!product) return null;
                return (
                    <>
                        <div
                            className="fixed inset-0 z-[9998] cursor-default"
                            onClick={() => {
                                setActiveDropdown(null);
                                setDropdownPosition(null);
                            }}
                        />
                        <div
                            className="fixed bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] border border-gray-100 py-1 z-[9999] animate-in fade-in zoom-in-95 duration-200"
                            style={{
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                                width: '12rem',
                                transformOrigin: 'top right'
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    setViewProduct(product);
                                    setActiveDropdown(null);
                                }}
                            >
                                <Eye className="w-4 h-4" /> View Details
                            </button>

                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    window.open(`/marketplace/${product.slug || product._id}`, '_blank');
                                    setActiveDropdown(null);
                                }}
                            >
                                <TrendingUp className="w-4 h-4" /> View Live
                            </button>

                            <div className="my-1 border-t border-gray-50" />

                            {/* Block/Activate for approved products */}
                            {(product.status === "active" || product.status === "published") && (
                                <button
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    onClick={() => confirmModal.confirm({
                                        title: "Block Product",
                                        message: `Block "${product.name}"? This will hide it from the marketplace.`,
                                        confirmText: "Block",
                                        onConfirm: () => handleAction(product._id, "block"),
                                    })}
                                    disabled={actionLoading === product._id}
                                >
                                    {actionLoading === product._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                                    Block Product
                                </button>
                            )}

                            {product.status === "blocked" && (
                                <button
                                    className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    onClick={() => confirmModal.confirm({
                                        title: "Activate Product",
                                        message: `Activate "${product.name}"? This will make it visible on the marketplace again.`,
                                        confirmText: "Activate",
                                        variant: "info",
                                        onConfirm: () => handleAction(product._id, "unblock"),
                                    })}
                                    disabled={actionLoading === product._id}
                                >
                                    {actionLoading === product._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Activate Product
                                </button>
                            )}
                        </div>
                    </>
                );
            })()}

            {/* View Product Modal */}
            {viewProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold">Product Details</h2>
                                <p className="text-sm text-gray-500">ID: {viewProduct._id}</p>
                            </div>
                            <button onClick={() => setViewProduct(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Top Section: Images & Basic Info */}
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Images Gallery */}
                                <div className="w-full lg:w-2/5 space-y-3">
                                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                                        {viewProduct.images?.[0] ? (
                                            <img src={viewProduct.images[0]} alt={viewProduct.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    {viewProduct.images && viewProduct.images.length > 1 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {viewProduct.images.slice(1, 5).map((img, idx) => (
                                                <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {viewProduct.videoUrl && (
                                        <p className="text-xs text-purple-600">🎬 Video available</p>
                                    )}
                                </div>

                                {/* Basic Info */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusBadge(viewProduct.status)}
                                            {viewProduct.isFeatured && (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Featured</span>
                                            )}
                                            {viewProduct.productType && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">{viewProduct.productType}</span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">{viewProduct.name}</h3>
                                        <p className="text-gray-500">{viewProduct.category}{viewProduct.subcategory ? ` › ${viewProduct.subcategory}` : ""}</p>
                                    </div>

                                    {/* Pricing */}
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-bold text-purple-600">{formatPrice(viewProduct.price)}</span>
                                        {viewProduct.compareAtPrice && viewProduct.compareAtPrice > viewProduct.price && (
                                            <>
                                                <span className="text-lg text-gray-400 line-through">{formatPrice(viewProduct.compareAtPrice)}</span>
                                                <span className="text-sm text-green-600 font-medium">
                                                    {Math.round((1 - viewProduct.price / viewProduct.compareAtPrice) * 100)}% OFF
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    {viewProduct.tags && viewProduct.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {viewProduct.tags.map((tag, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Stock</p>
                                            <p className="text-lg font-bold text-gray-900">{viewProduct.quantity} units</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Sales</p>
                                            <p className="text-lg font-bold text-gray-900">{viewProduct.salesCount || 0}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Views</p>
                                            <p className="text-lg font-bold text-gray-900">{viewProduct.views || 0}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Rating</p>
                                            <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                                                {viewProduct.rating || viewProduct.averageRating || 0}
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-xs text-gray-400">({viewProduct.reviewCount || 0})</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Studio/Seller Details */}
                            <div className="bg-purple-50 rounded-xl p-4">
                                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                    Studio / Seller Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-purple-700">Studio Name</p>
                                        <p className="font-medium text-gray-900">{viewProduct.seller?.studioProfile?.name || viewProduct.sellerName || viewProduct.seller?.name || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-700">Seller Name</p>
                                        <p className="font-medium text-gray-900">{viewProduct.seller?.name || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-700">Email</p>
                                        <p className="font-medium text-gray-900">{viewProduct.seller?.email || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-700">Seller ID</p>
                                        <p className="font-medium text-gray-900 font-mono text-sm">{viewProduct.seller?._id || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                                <div className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                                    {viewProduct.description || "No description provided."}
                                </div>
                            </div>

                            {/* Inventory & Shipping */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Inventory</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">SKU</span>
                                            <span className="font-medium font-mono">{viewProduct.sku || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Quantity</span>
                                            <span className="font-medium">{viewProduct.quantity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Track Inventory</span>
                                            <span className="font-medium">{viewProduct.trackInventory !== false ? "Yes" : "No"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Low Stock Alert</span>
                                            <span className="font-medium">{viewProduct.lowStockThreshold || 5} units</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Has Variants</span>
                                            <span className="font-medium">{viewProduct.hasVariants ? `Yes (${viewProduct.variants?.length || 0})` : "No"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Shipping</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Requires Shipping</span>
                                            <span className="font-medium">{viewProduct.shipping?.requiresShipping !== false ? "Yes" : "No"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Processing Time</span>
                                            <span className="font-medium">{viewProduct.shipping?.processingTime || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Weight</span>
                                            <span className="font-medium">{viewProduct.shipping?.weight ? `${viewProduct.shipping.weight} kg` : "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Dimensions (W×H×D)</span>
                                            <span className="font-medium">
                                                {viewProduct.shipping?.width || viewProduct.shipping?.height || viewProduct.shipping?.depth
                                                    ? `${viewProduct.shipping?.width || 0}×${viewProduct.shipping?.height || 0}×${viewProduct.shipping?.depth || 0} cm`
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Artwork Details (if applicable) */}
                            {viewProduct.artworkDetails && (
                                <div className="bg-amber-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-amber-900 mb-3">Artwork Details</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-amber-700 text-xs">Medium</p>
                                            <p className="font-medium">{viewProduct.artworkDetails.medium || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-700 text-xs">Style</p>
                                            <p className="font-medium">{viewProduct.artworkDetails.style || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-700 text-xs">Subject</p>
                                            <p className="font-medium">{viewProduct.artworkDetails.subject || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-700 text-xs">Orientation</p>
                                            <p className="font-medium capitalize">{viewProduct.artworkDetails.orientation || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-700 text-xs">Year Created</p>
                                            <p className="font-medium">{viewProduct.artworkDetails.yearCreated || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-700 text-xs">Original</p>
                                            <p className="font-medium">{viewProduct.artworkDetails.isOriginal ? "Yes" : "No"}</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-700 text-xs">Framed</p>
                                            <p className="font-medium">{viewProduct.artworkDetails.isFramed ? "Yes" : "No"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Variants */}
                            {viewProduct.hasVariants && viewProduct.variants && viewProduct.variants.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Variants ({viewProduct.variants.length})</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Attributes</th>
                                                    <th className="px-3 py-2 text-left">SKU</th>
                                                    <th className="px-3 py-2 text-right">Price</th>
                                                    <th className="px-3 py-2 text-right">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {viewProduct.variants.slice(0, 10).map((v, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-2">
                                                            {v.attributes.map(a => `${a.name}: ${a.value}`).join(", ")}
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-xs">{v.sku || "—"}</td>
                                                        <td className="px-3 py-2 text-right">{formatPrice(v.price)}</td>
                                                        <td className="px-3 py-2 text-right">{v.stock}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                                <div>
                                    <p className="text-gray-500 text-xs">Created</p>
                                    <p className="font-medium">{new Date(viewProduct.createdAt).toLocaleString()}</p>
                                </div>
                                {viewProduct.updatedAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Updated</p>
                                        <p className="font-medium">{new Date(viewProduct.updatedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {viewProduct.submittedAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Submitted</p>
                                        <p className="font-medium">{new Date(viewProduct.submittedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {viewProduct.publishedAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Published</p>
                                        <p className="font-medium">{new Date(viewProduct.publishedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {viewProduct.reviewedAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Reviewed</p>
                                        <p className="font-medium">{new Date(viewProduct.reviewedAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Rejection Reason */}
                            {viewProduct.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <h4 className="font-semibold text-red-800 mb-1">Rejection Reason</h4>
                                    <p className="text-red-700 text-sm">{viewProduct.rejectionReason}</p>
                                </div>
                            )}

                            {/* Care Instructions */}
                            {viewProduct.careInstructions && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Care Instructions</h4>
                                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{viewProduct.careInstructions}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                            {viewProduct.status === "pending" && (
                                <div className="mr-auto flex gap-2">
                                    <Button
                                        onClick={() => {
                                            if (confirm("Approve this product?")) {
                                                handleAction(viewProduct._id, "approve");
                                                setViewProduct(null);
                                            }
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Approve
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setViewProduct(null);
                                            setRejectModal({ isOpen: true, productId: viewProduct._id, reason: "" });
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <X className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                </div>
                            )}
                            <Button variant="outline" onClick={() => setViewProduct(null)}>Close</Button>
                            <Button onClick={() => window.open(`/marketplace/${viewProduct.slug || viewProduct._id}`, '_blank')}>View on Marketplace</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">Reject Product</h3>
                            <button
                                onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Please provide a reason for rejecting this product. This will be visible to the seller.
                            </p>
                            <textarea
                                className="w-full h-32 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                                placeholder="e.g. Inappropriate content, Missing information..."
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={!rejectModal.reason.trim() || !!actionLoading}
                                onClick={() => {
                                    if (rejectModal.productId) {
                                        handleAction(rejectModal.productId, "reject", rejectModal.reason);
                                    }
                                }}
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                                Reject Product
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Product Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Create New Product</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <h3 className="font-medium text-gray-900 mb-1">Product Creation</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Products are created by Studios from their dashboard.
                                </p>
                                <p className="text-xs text-gray-400">
                                    As admin, you can manage and moderate existing products.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
