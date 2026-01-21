"use client";

import * as React from "react";
import {
    Package,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    DollarSign,
    RefreshCw,
    MoreVertical,
    Edit,
    Archive
} from "lucide-react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    image?: string;
    quantity: number;
    lowStockThreshold: number;
    hasVariants: boolean;
    variants?: {
        id: string;
        label: string;
        stock: number;
        sku?: string;
    }[];
    price: number;
    status: "active" | "draft" | "sold" | "archived";
}

interface InventoryManagerProps {
    products: InventoryItem[];
    onUpdateStock: (productId: string, variantId: string | null, newStock: number) => Promise<void>;
    onEditProduct: (productId: string) => void;
}

export default function InventoryManager({
    products,
    onUpdateStock,
    onEditProduct
}: InventoryManagerProps) {
    const [filter, setFilter] = React.useState<"all" | "low" | "out">("all");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [updating, setUpdating] = React.useState<string | null>(null);

    // Calculate summary stats
    const stats = React.useMemo(() => {
        let totalItems = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let totalValue = 0;

        products.forEach(product => {
            if (product.hasVariants && product.variants) {
                product.variants.forEach(v => {
                    totalItems += v.stock;
                    totalValue += v.stock * product.price;
                    if (v.stock <= 0) outOfStockCount++;
                    else if (v.stock <= product.lowStockThreshold) lowStockCount++;
                });
            } else {
                totalItems += product.quantity;
                totalValue += product.quantity * product.price;
                if (product.quantity <= 0) outOfStockCount++;
                else if (product.quantity <= product.lowStockThreshold) lowStockCount++;
            }
        });

        return { totalItems, lowStockCount, outOfStockCount, totalValue };
    }, [products]);

    // Filter products
    const filteredProducts = React.useMemo(() => {
        return products.filter(product => {
            // Search filter
            const matchesSearch = !searchQuery ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            // Stock filter
            if (filter === "all") return true;

            const isLowStock = (qty: number, threshold: number) => qty > 0 && qty <= threshold;
            const isOutOfStock = (qty: number) => qty <= 0;

            if (product.hasVariants && product.variants) {
                if (filter === "out") return product.variants.some(v => isOutOfStock(v.stock));
                if (filter === "low") return product.variants.some(v => isLowStock(v.stock, product.lowStockThreshold));
            } else {
                if (filter === "out") return isOutOfStock(product.quantity);
                if (filter === "low") return isLowStock(product.quantity, product.lowStockThreshold);
            }

            return true;
        });
    }, [products, filter, searchQuery]);

    const handleStockUpdate = async (productId: string, variantId: string | null, newStock: number) => {
        setUpdating(`${productId}-${variantId}`);
        try {
            await onUpdateStock(productId, variantId, newStock);
        } finally {
            setUpdating(null);
        }
    };

    const getStockColor = (qty: number, threshold: number) => {
        if (qty <= 0) return "text-red-600 bg-red-50";
        if (qty <= threshold) return "text-amber-600 bg-amber-50";
        return "text-green-600 bg-green-50";
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalItems}</p>
                            <p className="text-sm text-gray-500">Total Units</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.lowStockCount}</p>
                            <p className="text-sm text-gray-500">Low Stock</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
                            <p className="text-sm text-gray-500">Out of Stock</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                ${stats.totalValue.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Inventory Value</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {[
                        { id: "all", label: "All Products" },
                        { id: "low", label: "Low Stock" },
                        { id: "out", label: "Out of Stock" }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.id
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex-1 max-w-xs">
                    <Input
                        placeholder="Search by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10"
                    />
                </div>
            </div>

            {/* Products Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(product => (
                                <React.Fragment key={product.id}>
                                    {/* Main product row */}
                                    <tr className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Package className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                                    {product.hasVariants && (
                                                        <p className="text-xs text-gray-500">{product.variants?.length || 0} variants</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.sku || "-"}</td>
                                        <td className="px-4 py-3">
                                            {!product.hasVariants && (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={product.quantity}
                                                        onChange={(e) => handleStockUpdate(product.id, null, parseInt(e.target.value) || 0)}
                                                        className="w-20 h-8 text-sm"
                                                        min={0}
                                                        disabled={updating === `${product.id}-null`}
                                                    />
                                                    {updating === `${product.id}-null` && (
                                                        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {!product.hasVariants && (
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStockColor(product.quantity, product.lowStockThreshold)}`}>
                                                    {product.quantity <= 0 ? "Out of Stock" : product.quantity <= product.lowStockThreshold ? "Low Stock" : "In Stock"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button variant="ghost" size="sm" onClick={() => onEditProduct(product.id)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>

                                    {/* Variant rows */}
                                    {product.hasVariants && product.variants?.map(variant => (
                                        <tr key={variant.id} className="bg-gray-50/30 hover:bg-gray-50">
                                            <td className="px-4 py-2 pl-16">
                                                <span className="text-sm text-gray-600">↳ {variant.label}</span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{variant.sku || "-"}</td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={variant.stock}
                                                        onChange={(e) => handleStockUpdate(product.id, variant.id, parseInt(e.target.value) || 0)}
                                                        className="w-20 h-8 text-sm"
                                                        min={0}
                                                        disabled={updating === `${product.id}-${variant.id}`}
                                                    />
                                                    {updating === `${product.id}-${variant.id}` && (
                                                        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStockColor(variant.stock, product.lowStockThreshold)}`}>
                                                    {variant.stock <= 0 ? "Out" : variant.stock <= product.lowStockThreshold ? "Low" : "OK"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2"></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No products match your filters</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
