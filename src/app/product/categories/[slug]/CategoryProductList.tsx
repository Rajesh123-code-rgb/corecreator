"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { Header } from "@/components/organisms";
import { useCart } from "@/context/CartContext";
import {
    Heart,
    Star,
    ShoppingCart,
    Loader2,
    Grid3X3,
    LayoutList,
    SlidersHorizontal,
    Search
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface Seller {
    _id: string;
    name: string;
    avatar?: string;
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: { url: string; isPrimary: boolean }[];
    seller: Seller;
    rating: number;
    reviewCount?: number;
    category: string;
    isFeatured?: boolean;
}

export default function CategoryProductList({ categorySlug }: { categorySlug: string }) {
    // State
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = React.useState("newest");
    const { addItem } = useCart();
    const { formatPrice } = useCurrency();
    const [wishlist, setWishlist] = React.useState<Set<string>>(new Set());

    // NOTE: categorySlug passed here is the Name (e.g. "Paintings"), which matches what the API likely expects if it filters by name.
    // The previous page passed category.name.

    React.useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Construct URL to existing API
                // Assuming the API filters by 'category' parameter which matches the category name stored in DB
                const params = new URLSearchParams();
                params.set("category", categorySlug); // API expects "Paintings", "Prints" etc.
                params.set("limit", "20");
                params.set("sort", sortBy);

                const res = await fetch(`/api/products?${params.toString()}`);
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

        fetchProducts();
    }, [categorySlug, sortBy]);

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
            id: product._id,
            type: "product",
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images.find(i => i.isPrimary)?.url || product.images[0]?.url || "",
            seller: product.seller.name
        });
    };

    const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setWishlist(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <p className="text-[var(--muted-foreground)]">
                    Showing <strong>{products.length}</strong> results
                </p>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                        >
                            <option value="newest">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="popular">Most Popular</option>
                            <option value="rating">Best Rated</option>
                        </select>
                        <SlidersHorizontal className="w-4 h-4 text-[var(--muted-foreground)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="hidden sm:flex items-center border border-[var(--border)] rounded-lg overflow-hidden p-1 bg-[var(--card)]">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[var(--secondary-100)] text-[var(--secondary-600)]" : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"}`}
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[var(--secondary-100)] text-[var(--secondary-600)]" : "hover:bg-[var(--muted)] text-[var(--muted-foreground)]"}`}
                        >
                            <LayoutList className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
                </div>
            ) : products.length > 0 ? (
                <div className={viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "flex flex-col gap-4"
                }>
                    {products.map((product) => (
                        <Card key={product._id} hover className={`group overflow-hidden bg-[var(--card)] border-[var(--border)] ${viewMode === "list" ? "flex flex-row h-48" : ""}`}>
                            <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 h-full flex-shrink-0" : "aspect-square"}`}>
                                <Link href={`/marketplace/${product.slug}`} className="block w-full h-full cursor-pointer">
                                    <img
                                        src={product.images.find(i => i.isPrimary)?.url || product.images[0]?.url || "https://placehold.co/400x500?text=No+Image"}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                </Link>
                                {product.compareAtPrice && (
                                    <span className="absolute top-3 left-3 px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-md z-10 pointer-events-none shadow-sm">
                                        SALE
                                    </span>
                                )}
                                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
                                    <button
                                        onClick={(e) => handleToggleWishlist(e, product._id)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors ${wishlist.has(product._id) ? "text-red-500 fill-red-500" : "text-gray-700 hover:text-red-500"}`}
                                    >
                                        <Heart className={`w-4 h-4 ${wishlist.has(product._id) ? "fill-current" : ""}`} />
                                    </button>
                                    <button
                                        onClick={(e) => handleAddToCart(e, product)}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors text-gray-700 hover:text-[var(--secondary-600)]"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <CardContent className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-center" : ""}`}>
                                <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1 uppercase tracking-wider">{product.category}</p>
                                <Link href={`/marketplace/${product.slug}`} className={`font-bold text-[var(--foreground)] line-clamp-2 hover:text-[var(--secondary-600)] transition-colors mb-2 ${viewMode === "list" ? "text-xl" : "text-base"}`}>
                                    {product.name}
                                </Link>
                                <p className="text-xs text-[var(--muted-foreground)] mb-3">by <span className="font-medium text-[var(--foreground)]">{product.seller?.name || "Artist"}</span></p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-lg font-bold text-[var(--secondary-600)]">{formatPrice(product.price)}</span>
                                        {product.compareAtPrice && (
                                            <span className="text-sm text-[var(--muted-foreground)] line-through decoration-red-500/50">{formatPrice(product.compareAtPrice)}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        <span className="text-xs font-medium">{product.rating?.toFixed(1) || "0.0"}</span>
                                    </div>
                                </div>
                                {viewMode === "list" && (
                                    <p className="mt-4 text-sm text-[var(--muted-foreground)] line-clamp-2 max-w-2xl">
                                        Discover this unique handcrafted piece. Verified authentic and shipped directly from the artist's studio.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 px-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--muted)]/50">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-[var(--muted-foreground)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No products found</h3>
                    <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                        We couldn't find any products in this category yet. Check back later as our artists are always adding new creations.
                    </p>
                    <Button variant="outline" className="mt-6" asChild>
                        <Link href="/marketplace">
                            Browse all products
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
