"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Package,
    Edit,
    Trash2,
    Eye,
    Archive,
    MoreHorizontal
} from "lucide-react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";
import { useConfirmModal } from "@/components/molecules";
import { useCurrency } from "@/context/CurrencyContext";

interface Product {
    id: string;
    title: string;
    status: "active" | "draft" | "archived" | "sold";
    sales: number;
    views: number;
    price: number;
    currency?: "USD" | "INR" | "EUR" | "GBP";
    thumbnail: string;
    slug: string;
    sku: string;
    stock: number;
    createdAt: string;
    updatedAt: string;
}

export default function StudioProductsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { formatPrice } = useCurrency();
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const confirmModal = useConfirmModal();

    React.useEffect(() => {
        fetchProducts();
    }, [statusFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/studio/products?${params.toString()}`);
            const data = await res.json();

            if (data.products) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/studio/products/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete product:", error);
        }
    };

    const handleCreateProduct = async () => {
        try {
            const res = await fetch("/api/studio/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Untitled Product",
                    status: "draft"
                })
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Create product failed:", data);
                alert(data.error || "Failed to create product");
                return;
            }

            if (data.product?.id) {
                router.push(`/studio/products/${data.product.id}/edit`);
            }
        } catch (error) {
            console.error("Failed to create draft:", error);
            alert("An error occurred while creating the product.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products & Artworks</h1>
                    <p className="text-gray-500">Manage your product inventory and listings</p>
                </div>
                <Button onClick={handleCreateProduct} className="gradient-gold text-white shadow-lg shadow-amber-500/20">
                    <Plus className="w-4 h-4 mr-2" />
                    New Product
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search products..."
                        className="pl-9 w-full bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
                <div className="flex gap-2">
                    <select
                        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Products List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="bg-white border boundary-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Product</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Inventory</th>
                                <th className="px-6 py-4 font-medium">Price</th>
                                <th className="px-6 py-4 font-medium">Sales</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map((product) => (
                                <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200">
                                                {product.thumbnail ? (
                                                    <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors">{product.title}</p>
                                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${product.status === 'active' ? 'bg-green-100 text-green-800' :
                                                product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {product.stock} in stock
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {formatPrice(product.price, product.currency || "INR")}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {product.sales} sold
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/studio/products/${product.id}/edit`}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-amber-600">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                                                onClick={() => confirmModal.confirm({
                                                    title: "Delete Product",
                                                    message: "Are you sure you want to delete this product? This action cannot be undone.",
                                                    confirmText: "Delete",
                                                    onConfirm: () => handleDelete(product.id),
                                                })}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Card className="py-16 text-center border-dashed">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        Start selling your art by creating your first product listing.
                    </p>
                    <Button onClick={handleCreateProduct} className="gradient-gold text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Product
                    </Button>
                </Card>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
