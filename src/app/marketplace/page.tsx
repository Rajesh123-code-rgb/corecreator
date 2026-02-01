"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header, Footer } from "@/components/organisms";
import { Button, ImageWithFallback } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { useCart } from "@/context/CartContext";
import {
    Search,
    SlidersHorizontal,
    Grid3X3,
    LayoutList,
    Heart,
    Star,
    ShoppingCart,
    Loader2,
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
    currency?: "USD" | "INR" | "EUR" | "GBP";
    images: { url: string; isPrimary: boolean }[];
    seller: Seller;
    rating: number;
    reviewCount?: number;
    category: string;
    isFeatured?: boolean;
    shipping?: {
        isFreeShipping?: boolean;
        shippingPrice?: number;
    };
}

interface CategoryItem {
    _id: string;
    name: string;
    slug: string;
}

function MarketplaceContent() {
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const searchParams = useSearchParams();

    // Query Params
    const categoryParam = searchParams.get("category") || "all";
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const minRatingParam = searchParams.get("minRating");
    const pageParam = parseInt(searchParams.get("page") || "1");
    const searchParam = searchParams.get("search") || "";
    const sortParam = searchParams.get("sort") || "newest";

    // State
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [totalPages, setTotalPages] = React.useState(0);
    const [totalResults, setTotalResults] = React.useState(0);
    const [searchTerm, setSearchTerm] = React.useState(searchParam);
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
    const { addItem } = useCart();
    const [wishlist, setWishlist] = React.useState<Set<string>>(new Set());
    const [categories, setCategories] = React.useState<CategoryItem[]>([]);

    // Fetch categories from database
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories?type=product");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Filters State
    const [selectedCategory, setSelectedCategory] = React.useState(categoryParam);
    const [priceRange, setPriceRange] = React.useState<{ min: string, max: string }>({
        min: minPriceParam || "",
        max: maxPriceParam || ""
    });
    const [selectedRating, setSelectedRating] = React.useState(minRatingParam ? parseFloat(minRatingParam) : 0);

    const fetchProducts = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryParam && categoryParam !== "all") params.set("category", categoryParam);
            if (minPriceParam) params.set("minPrice", minPriceParam);
            if (maxPriceParam) params.set("maxPrice", maxPriceParam);
            if (minRatingParam) params.set("minRating", minRatingParam);
            if (searchParam) params.set("search", searchParam);
            params.set("page", pageParam.toString());
            params.set("limit", "12");
            params.set("sort", sortParam);

            const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
            const data = await res.json();

            if (data.products) {
                setProducts(data.products);
                setTotalPages(data.pagination.pages);
                setTotalResults(data.pagination.total);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, [categoryParam, minPriceParam, maxPriceParam, minRatingParam, pageParam, searchParam, sortParam]);

    React.useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    React.useEffect(() => {
        if (minRatingParam) {
            setSelectedRating(parseFloat(minRatingParam));
        } else {
            setSelectedRating(0);
        }
    }, [minRatingParam]);

    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        if (!updates.page) {
            params.set("page", "1");
        }
        router.push(`/marketplace?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateParams({ search: searchTerm });
    };

    const handleCategoryChange = (slug: string) => {
        setSelectedCategory(slug);
        updateParams({ category: slug === "all" ? null : slug });
    };

    const handlePriceApply = () => {
        updateParams({
            minPrice: priceRange.min,
            maxPrice: priceRange.max
        });
    };

    const handleRatingChange = (rating: number) => {
        if (selectedRating === rating) {
            setSelectedRating(0);
            updateParams({ minRating: null });
        } else {
            setSelectedRating(rating);
            updateParams({ minRating: rating.toString() });
        }
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateParams({ sort: e.target.value });
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`/marketplace?${params.toString()}`);
    };

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
            seller: product.seller.name,
            // Include shipping data for checkout calculation
            shippingPrice: product.shipping?.shippingPrice || 0,
            isFreeShipping: product.shipping?.isFreeShipping || false,
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
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero Banner */}
            <section className="pt-24 pb-8 bg-gradient-to-r from-[var(--secondary-600)] to-[var(--secondary-700)]">
                <div className="container-app">
                    <div className="text-center text-white">
                        <h1 className="text-3xl lg:text-4xl font-bold mb-3">Art & Craft Marketplace</h1>
                        <p className="text-white/80 max-w-xl mx-auto">Discover unique handcrafted artworks from talented artists worldwide</p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto mt-6">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search artworks, artists, or styles..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary-400)]"
                            />
                            <Button type="submit" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2">
                                Search
                            </Button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8">
                <div className="container-app">
                    <div className="flex gap-8">
                        {/* Sidebar Filters */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-6">
                                {/* Categories */}
                                <div>
                                    <h3 className="font-semibold mb-3">Categories</h3>
                                    <ul className="space-y-2">
                                        <li>
                                            <button
                                                onClick={() => handleCategoryChange("all")}
                                                className={`w-full text-left flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-sm ${selectedCategory === "all" ? "bg-[var(--secondary-100)] text-[var(--secondary-700)] font-medium" : "hover:bg-[var(--muted)]"}`}
                                            >
                                                <span>All</span>
                                            </button>
                                        </li>
                                        {categories.map((cat) => (
                                            <li key={cat._id}>
                                                <button
                                                    onClick={() => handleCategoryChange(cat.slug)}
                                                    className={`w-full text-left flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-sm ${selectedCategory === cat.slug ? "bg-[var(--secondary-100)] text-[var(--secondary-700)] font-medium" : "hover:bg-[var(--muted)]"}`}
                                                >
                                                    <span>{cat.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <h3 className="font-semibold mb-3">Price Range</h3>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={priceRange.min}
                                                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={priceRange.max}
                                                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
                                            />
                                        </div>
                                        <Button onClick={handlePriceApply} variant="outline" size="sm" className="w-full">Apply</Button>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div>
                                    <h3 className="font-semibold mb-3">Rating</h3>
                                    <div className="space-y-2">
                                        {[4, 3, 2, 1].map((rating) => (
                                            <label key={rating} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="rating"
                                                    checked={selectedRating === rating}
                                                    onChange={() => handleRatingChange(rating)}
                                                    className="accent-[var(--secondary-600)] w-4 h-4 cursor-pointer"
                                                />
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-4 h-4 ${i < rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-[var(--muted-foreground)]">& up</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Product Grid */}
                        <div className="flex-1">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Showing <strong>{products.length > 0 ? (pageParam - 1) * 12 + 1 : 0}-{Math.min(pageParam * 12, totalResults)}</strong> of <strong>{totalResults}</strong> products
                                </p>
                                <div className="flex items-center gap-3">
                                    <button className="lg:hidden p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]">
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                    <select
                                        value={sortParam}
                                        onChange={handleSortChange}
                                        className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Best Rated</option>
                                    </select>
                                    <div className="hidden sm:flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`p-2 ${viewMode === "grid" ? "bg-[var(--secondary-100)] text-[var(--secondary-600)]" : "hover:bg-[var(--muted)]"}`}
                                        >
                                            <Grid3X3 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={`p-2 ${viewMode === "list" ? "bg-[var(--secondary-100)] text-[var(--secondary-600)]" : "hover:bg-[var(--muted)]"}`}
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
                                    ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
                                    : "flex flex-col gap-4"
                                }>
                                    {products.map((product) => (
                                        <Card key={product._id} hover className={`group overflow-hidden ${viewMode === "list" ? "flex flex-row h-48" : ""}`}>
                                            <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 h-full flex-shrink-0" : "aspect-square"}`}>
                                                <Link href={`/marketplace/${product.slug}`} className="block w-full h-full cursor-pointer">
                                                    <ImageWithFallback
                                                        src={product.images.find(i => i.isPrimary)?.url || product.images[0]?.url || ""}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                </Link>
                                                {product.compareAtPrice && (
                                                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full z-10 pointer-events-none">
                                                        Sale
                                                    </span>
                                                )}
                                                {product.isFeatured && (
                                                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium gradient-gold text-white rounded-full z-10 pointer-events-none">
                                                        Featured
                                                    </span>
                                                )}
                                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                    <button
                                                        onClick={(e) => handleToggleWishlist(e, product._id)}
                                                        className={`p-2 rounded-full bg-white shadow-lg hover:bg-[var(--secondary-100)] transition-colors ${wishlist.has(product._id) ? "text-red-500 fill-red-500" : "text-gray-700"}`}
                                                    >
                                                        <Heart className={`w-4 h-4 ${wishlist.has(product._id) ? "fill-current" : ""}`} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleAddToCart(e, product)}
                                                        className="p-2 rounded-full bg-white shadow-lg hover:bg-[var(--secondary-100)] transition-colors text-gray-700"
                                                    >
                                                        <ShoppingCart className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <CardContent className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-center" : ""}`}>
                                                <p className="text-xs text-[var(--muted-foreground)] mb-1">{product.category}</p>
                                                <Link href={`/marketplace/${product.slug}`} className={`font-medium line-clamp-2 hover:text-[var(--secondary-600)] transition-colors ${viewMode === "list" ? "text-lg" : "text-sm"}`}>
                                                    {product.name}
                                                </Link>
                                                <p className="text-xs text-[var(--muted-foreground)] mt-1">by {product.seller?.name || "Artist"}</p>
                                                <div className="flex items-center gap-1 mt-2">
                                                    {product.rating > 0 ? (
                                                        <>
                                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-xs font-medium">{product.rating?.toFixed(1) || "0.0"}</span>
                                                            <span className="text-xs text-[var(--muted-foreground)]">({product.reviewCount || 0})</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-[var(--muted-foreground)]">New</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="font-bold text-[var(--secondary-600)]">{formatPrice(product.price, product.currency || "INR")}</span>
                                                    {product.compareAtPrice && (
                                                        <span className="text-sm text-[var(--muted-foreground)] line-through">{formatPrice(product.compareAtPrice, product.currency || "INR")}</span>
                                                    )}
                                                </div>
                                                {viewMode === "list" && (
                                                    <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
                                                        Handcrafted with care. Check out this amazing piece of art from our collection.
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                                    <Search className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" />
                                    <h3 className="text-lg font-medium text-[var(--foreground)]">No products found</h3>
                                    <p className="text-[var(--muted-foreground)] text-sm mt-1">Try adjusting your filters or search terms</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 text-white border-gray-600 hover:bg-gray-800"
                                        onClick={() => updateParams({ category: null, minPrice: null, maxPrice: null, minRating: null, search: null })}
                                    >
                                        Clear all filters
                                    </Button>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pageParam === 1}
                                        onClick={() => handlePageChange(pageParam - 1)}
                                    >
                                        Previous
                                    </Button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === pageParam ? "bg-[var(--secondary-500)] text-white" : "hover:bg-[var(--muted)]"}`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pageParam === totalPages}
                                        onClick={() => handlePageChange(pageParam + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default function MarketplacePage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--secondary-500)] border-t-transparent rounded-full" />
            </div>
        }>
            <MarketplaceContent />
        </React.Suspense>
    );
}
