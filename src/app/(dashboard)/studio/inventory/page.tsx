"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import InventoryManager from "@/components/organisms/InventoryManager";

interface Product {
    _id: string;
    name: string;
    sku?: string;
    images: { url: string; isPrimary: boolean }[];
    quantity: number;
    lowStockThreshold: number;
    hasVariants: boolean;
    variants: {
        id: string;
        attributes: { name: string; value: string }[];
        stock: number;
        sku?: string;
    }[];
    price: number;
    status: string;
}

export default function InventoryPage() {
    const router = useRouter();
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/studio/products?include=inventory");
            const data = await res.json();
            if (data.products) {
                setProducts(data.products);
            }
        } catch (err) {
            setError("Failed to load inventory");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (productId: string, variantId: string | null, newStock: number) => {
        try {
            const res = await fetch(`/api/studio/products/${productId}/stock`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ variantId, stock: newStock })
            });

            if (!res.ok) throw new Error("Failed to update stock");

            // Update local state
            setProducts(prev => prev.map(p => {
                if (p._id !== productId) return p;

                if (variantId) {
                    return {
                        ...p,
                        variants: p.variants.map(v =>
                            v.id === variantId ? { ...v, stock: newStock } : v
                        )
                    };
                } else {
                    return { ...p, quantity: newStock };
                }
            }));
        } catch (err) {
            console.error("Stock update error:", err);
            throw err;
        }
    };

    const handleEditProduct = (productId: string) => {
        router.push(`/studio/products/${productId}/edit`);
    };

    // Transform products for InventoryManager
    const inventoryItems = products.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        image: p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url,
        quantity: p.quantity || 0,
        lowStockThreshold: p.lowStockThreshold || 5,
        hasVariants: p.hasVariants && p.variants?.length > 0,
        variants: p.variants?.map(v => ({
            id: v.id,
            label: v.attributes.map(a => a.value).join(" / "),
            stock: v.stock,
            sku: v.sku
        })),
        price: p.price,
        status: p.status as any
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p>{error}</p>
                <button onClick={fetchProducts} className="mt-4 text-amber-600 hover:underline">
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-500">Track stock levels and manage your product inventory</p>
            </div>

            <InventoryManager
                products={inventoryItems}
                onUpdateStock={handleUpdateStock}
                onEditProduct={handleEditProduct}
            />
        </div>
    );
}
