"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import VariantSelector from "@/components/molecules/VariantSelector";
import CustomizationInput from "@/components/molecules/CustomizationInput";
import AddOnsSelector from "@/components/molecules/AddOnsSelector";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
    Heart,
    Share2,
    Star,
    ShoppingCart,
    Truck,
    Shield,
    RotateCcw,
    ChevronRight,
    Minus,
    Plus,
    Package,
    Info,
    FileText,
    Sparkles,
    MessageSquare,
    ThumbsUp,
    Send,
    User,
    X,
    Check,
    Copy,
    Facebook,
    Twitter,
} from "lucide-react";

interface ProductClientPageProps {
    product: any;
    relatedProducts: any[];
}

interface Review {
    _id: string;
    user: { _id: string; name: string; avatar?: string };
    rating: number;
    title?: string;
    comment: string;
    helpfulCount: number;
    isVerifiedPurchase: boolean;
    createdAt: string;
}

interface ReviewStats {
    avgRating: string;
    totalReviews: number;
    distribution: Record<number, number>;
}

export default function ProductClientPage({ product, relatedProducts }: ProductClientPageProps) {
    const { data: session } = useSession();
    const { addItem } = useCart();
    const { formatPrice } = useCurrency();
    const [activeImage, setActiveImage] = useState(
        product.images.find((i: any) => i.isPrimary)?.url || product.images[0]?.url
    );
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [activeTab, setActiveTab] = useState<"description" | "details" | "shipping" | "reviews">("description");

    // Review state - initialize with product's existing rating data
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewStats, setReviewStats] = useState<ReviewStats>({
        avgRating: product.rating?.toString() || "0.0",
        totalReviews: product.reviewCount || 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewSort, setReviewSort] = useState("newest");

    // Review form state
    const [newReview, setNewReview] = useState({ rating: 5, title: "", comment: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Share modal state
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Variant, Customization, and Add-on state
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [customizationValues, setCustomizationValues] = useState<{ id: string; value: string; priceModifier: number }[]>([]);
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

    // Calculate total price dynamically
    const calculatedPrice = useMemo(() => {
        let price = selectedVariant?.price ?? product.price;

        // Add customization price modifiers
        customizationValues.forEach(cv => {
            price += cv.priceModifier || 0;
        });

        // Add selected add-ons
        (product.addOns || []).forEach((addOn: any) => {
            if (selectedAddOns.includes(addOn.id)) {
                price += addOn.price;
            }
        });

        return price;
    }, [selectedVariant, customizationValues, selectedAddOns, product.price, product.addOns]);

    // Check if product is out of stock
    const isOutOfStock = useMemo(() => {
        // For products with variants, check if selected variant has stock
        if (product.hasVariants && product.variants?.length > 0) {
            if (selectedVariant) {
                return (selectedVariant.stock ?? 0) <= 0;
            }
            // If no variant selected, check if ALL variants are out of stock
            return product.variants.every((v: any) => (v.stock ?? 0) <= 0);
        }
        // For simple products, check quantity
        return (product.quantity ?? 0) <= 0;
    }, [product.hasVariants, product.variants, product.quantity, selectedVariant]);

    // Handle variant selection with memoized callback
    const handleVariantSelect = useCallback((variant: any) => {
        setSelectedVariant(variant);
    }, []);

    // Fetch reviews
    useEffect(() => {
        fetchReviews();
    }, [product._id, reviewSort]);

    const fetchReviews = async () => {
        try {
            setReviewsLoading(true);
            const res = await fetch(`/api/reviews?targetType=product&targetId=${product._id}&sort=${reviewSort}&limit=10`);
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews);
                setReviewStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleQuantityChange = (delta: number) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    const handleAddToCart = () => {
        // Validate required customizations
        const requiredCustomizations = (product.customizations || []).filter((c: any) => c.required);
        const missingRequired = requiredCustomizations.filter((c: any) =>
            !customizationValues.find(cv => cv.id === c.id && cv.value)
        );

        if (missingRequired.length > 0) {
            alert(`Please complete required field: ${missingRequired[0].label}`);
            return;
        }

        // Build cart item with all configuration
        const cartItem: any = {
            id: product._id,
            type: "product",
            name: product.name,
            price: calculatedPrice,
            quantity: quantity,
            image: activeImage,
            seller: product.seller?.name || "Studio",
        };

        // Add variant info if selected
        if (selectedVariant) {
            cartItem.variant = {
                id: selectedVariant.id,
                label: selectedVariant.attributes.map((a: any) => a.value).join(" / "),
                sku: selectedVariant.sku
            };
        }

        // Add customizations
        if (customizationValues.length > 0) {
            cartItem.customizations = customizationValues.map(cv => {
                const opt = (product.customizations || []).find((c: any) => c.id === cv.id);
                return {
                    label: opt?.label || cv.id,
                    value: cv.value
                };
            });
        }

        // Add add-ons
        if (selectedAddOns.length > 0) {
            cartItem.addOns = selectedAddOns.map(id => {
                const addOn = (product.addOns || []).find((a: any) => a.id === id);
                return {
                    id,
                    title: addOn?.title || id,
                    price: addOn?.price || 0
                };
            });
        }

        addItem(cartItem);
    };

    const handleToggleWishlist = () => {
        setIsWishlisted(!isWishlisted);
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) {
            setSubmitError("Please log in to submit a review");
            return;
        }

        if (!newReview.comment.trim()) {
            setSubmitError("Please write a review");
            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetType: "product",
                    targetId: product._id,
                    rating: newReview.rating,
                    title: newReview.title,
                    comment: newReview.comment,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit review");
            }

            setSubmitSuccess(true);
            setNewReview({ rating: 5, title: "", comment: "" });
            setShowReviewForm(false);
            fetchReviews(); // Refresh reviews

            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (error: any) {
            setSubmitError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = async (platform?: string) => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        const text = `Check out ${product.name} on CoreCreator!`;

        if (platform === "facebook") {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        } else if (platform === "twitter") {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        } else if (platform === "copy") {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            setShowShareModal(true);
        }
    };

    const scrollToReviews = () => {
        setActiveTab("reviews");
        document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
    };

    const tabs = [
        { id: "description", label: "Description", icon: FileText },
        { id: "details", label: "Product Details", icon: Info },
        { id: "shipping", label: "Shipping & Returns", icon: Package },
        { id: "reviews", label: `Reviews (${reviewStats.totalReviews})`, icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <main className="pt-20 pb-16">
                <div className="container-app">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                        <Link href="/" className="hover:text-[var(--foreground)]">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/marketplace" className="hover:text-[var(--foreground)]">Marketplace</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/marketplace?category=${product.category.toLowerCase()}`} className="hover:text-[var(--foreground)]">{product.category}</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[var(--foreground)] truncate">{product.name}</span>
                    </nav>

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Product Images */}
                        <div className="space-y-4">
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--muted)]">
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {product.images.map((img: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(img.url)}
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === img.url ? "border-[var(--secondary-500)] ring-2 ring-[var(--secondary-500)]/30" : "border-transparent hover:border-[var(--border)]"}`}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-[var(--secondary-600)] font-medium">{product.category}</span>
                                {product.subcategory && (
                                    <>
                                        <span className="text-[var(--muted-foreground)]">•</span>
                                        <span className="text-sm text-[var(--muted-foreground)]">{product.subcategory}</span>
                                    </>
                                )}
                            </div>

                            <h1 className="text-2xl lg:text-3xl font-bold mb-4">{product.name}</h1>

                            {/* Rating & Reviews - Now Interactive */}
                            <div className="flex items-center gap-4 mb-6">
                                <button onClick={scrollToReviews} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(parseFloat(reviewStats.avgRating)) ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                                    ))}
                                    <span className="ml-2 font-medium">{reviewStats.avgRating}</span>
                                </button>
                                <button onClick={scrollToReviews} className="text-sm text-[var(--secondary-600)] hover:underline">
                                    {reviewStats.totalReviews} reviews
                                </button>
                                <button onClick={() => handleShare()} className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                                    <Share2 className="w-4 h-4" /> Share
                                </button>
                            </div>

                            {/* Dynamic Price Display */}
                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-3xl font-bold text-[var(--secondary-600)]">{formatPrice(calculatedPrice, product.currency || "INR")}</span>
                                {product.compareAtPrice && calculatedPrice < product.compareAtPrice && (
                                    <>
                                        <span className="text-xl text-[var(--muted-foreground)] line-through">{formatPrice(product.compareAtPrice, product.currency || "INR")}</span>
                                        <span className="px-2 py-1 text-sm font-medium bg-red-100 text-red-600 rounded-full">
                                            {Math.round((1 - calculatedPrice / product.compareAtPrice) * 100)}% OFF
                                        </span>
                                    </>
                                )}
                                {calculatedPrice !== product.price && (
                                    <span className="text-xs text-gray-500">
                                        (Base: {formatPrice(product.price, product.currency || "INR")})
                                    </span>
                                )}
                            </div>

                            {/* Variant Selector */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-6">
                                    <VariantSelector
                                        variants={product.variants}
                                        basePrice={product.price}
                                        selectedVariant={selectedVariant}
                                        onSelect={handleVariantSelect}
                                    />
                                </div>
                            )}

                            {/* Customization Inputs */}
                            {product.customizations && product.customizations.length > 0 && (
                                <div className="mb-6">
                                    <CustomizationInput
                                        customizations={product.customizations}
                                        values={customizationValues}
                                        onChange={setCustomizationValues}
                                    />
                                </div>
                            )}

                            {/* Add-ons Selector */}
                            {product.addOns && product.addOns.filter((a: any) => a.active).length > 0 && (
                                <div className="mb-6">
                                    <AddOnsSelector
                                        addOns={product.addOns}
                                        selected={selectedAddOns}
                                        onChange={setSelectedAddOns}
                                    />
                                </div>
                            )}

                            {/* Artwork Details */}
                            {product.artworkDetails && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--muted)] rounded-xl mb-6">
                                    {product.artworkDetails.medium && (
                                        <div><span className="text-sm text-[var(--muted-foreground)]">Medium</span><p className="font-medium">{product.artworkDetails.medium}</p></div>
                                    )}
                                    {product.dimensions && (
                                        <div><span className="text-sm text-[var(--muted-foreground)]">Size</span><p className="font-medium">{product.dimensions.length} x {product.dimensions.width} {product.dimensions.unit || "cm"}</p></div>
                                    )}
                                    {product.artworkDetails.style && (
                                        <div><span className="text-sm text-[var(--muted-foreground)]">Style</span><p className="font-medium">{product.artworkDetails.style}</p></div>
                                    )}
                                    {product.artworkDetails.yearCreated && (
                                        <div><span className="text-sm text-[var(--muted-foreground)]">Year</span><p className="font-medium">{product.artworkDetails.yearCreated}</p></div>
                                    )}
                                </div>
                            )}


                            {/* Quantity & Add to Cart */}
                            {isOutOfStock ? (
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                                        <Package className="w-6 h-6 text-red-500" />
                                        <div>
                                            <p className="font-semibold text-red-700">Out of Stock</p>
                                            <p className="text-sm text-red-600">This item is currently unavailable</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button disabled variant="secondary" size="lg" className="flex-1 opacity-50 cursor-not-allowed">
                                            <ShoppingCart className="w-5 h-5 mr-2" /> Out of Stock
                                        </Button>
                                        <Button onClick={handleToggleWishlist} variant="outline" size="lg" className={isWishlisted ? "text-red-500 border-red-200 bg-red-50" : ""}>
                                            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center border border-[var(--border)] rounded-lg">
                                        <button onClick={() => handleQuantityChange(-1)} className="p-3 hover:bg-[var(--muted)]"><Minus className="w-4 h-4" /></button>
                                        <span className="w-12 text-center font-medium">{quantity}</span>
                                        <button onClick={() => handleQuantityChange(1)} className="p-3 hover:bg-[var(--muted)]"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <Button onClick={handleAddToCart} variant="secondary" size="lg" className="flex-1">
                                        <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart - {formatPrice(calculatedPrice * quantity, product.currency || "INR")}
                                    </Button>
                                    <Button onClick={handleToggleWishlist} variant="outline" size="lg" className={isWishlisted ? "text-red-500 border-red-200 bg-red-50" : ""}>
                                        <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
                                    </Button>
                                </div>
                            )}

                            {/* Shipping Info */}
                            <div className="space-y-3 p-4 border border-[var(--border)] rounded-xl mb-6">
                                <div className="flex items-center gap-3">
                                    <Truck className="w-5 h-5 text-green-600" />
                                    <div><p className="font-medium text-green-600">Free Shipping</p><p className="text-sm text-[var(--muted-foreground)]">Estimated 5-7 business days</p></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <RotateCcw className="w-5 h-5 text-[var(--secondary-600)]" />
                                    <div><p className="font-medium">30-day returns</p><p className="text-sm text-[var(--muted-foreground)]">Free returns on this item</p></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-[var(--secondary-600)]" />
                                    <div><p className="font-medium">Buyer Protection</p><p className="text-sm text-[var(--muted-foreground)]">Full refund if item doesn't arrive</p></div>
                                </div>
                            </div>

                            {/* Seller Info */}
                            <div className="flex items-center gap-4 p-4 border border-[var(--border)] rounded-xl">
                                <img src={product.seller.avatar || "https://placehold.co/100x100?text=Seller"} alt={product.seller.name} className="w-14 h-14 rounded-full object-cover" />
                                <div className="flex-1">
                                    <p className="font-semibold">{product.seller.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                        {product.seller.rating && product.seller.rating > 0 ? (
                                            <>
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span>{product.seller.rating.toFixed(1)} rating</span>
                                            </>
                                        ) : (
                                            <span>New seller</span>
                                        )}
                                    </div>
                                </div>
                                <Link href={`/studio/${product.seller._id || product.seller}`}>
                                    <Button variant="outline" size="sm">View Studio</Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Description Section with Tabs */}
                    <div className="mt-16" id="reviews-section">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-[var(--border)] mb-6 overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                            ? "border-[var(--secondary-600)] text-[var(--secondary-600)]"
                                            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-[var(--muted)]/30 rounded-2xl p-6 lg:p-8">
                            {activeTab === "description" && (
                                <div className="space-y-6">
                                    <div className="prose prose-lg max-w-none dark:prose-invert">
                                        {product.description ? (
                                            <div dangerouslySetInnerHTML={{ __html: product.description }} />
                                        ) : (
                                            <p className="text-[var(--muted-foreground)]">No description available for this product.</p>
                                        )}
                                    </div>

                                    {product.tags && product.tags.length > 0 && (
                                        <div className="pt-6 border-t border-[var(--border)]">
                                            <h4 className="text-sm font-medium mb-3">Tags</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {product.tags.map((tag: string, i: number) => (
                                                    <Link
                                                        key={i}
                                                        href={`/marketplace?search=${encodeURIComponent(tag)}`}
                                                        className="px-3 py-1 text-sm bg-[var(--muted)] hover:bg-[var(--secondary-100)] rounded-full transition-colors"
                                                    >
                                                        {tag}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "details" && (
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">Product Specifications</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                    <span className="text-[var(--muted-foreground)]">Category</span>
                                                    <span className="font-medium">{product.category}</span>
                                                </div>
                                                {product.subcategory && (
                                                    <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                        <span className="text-[var(--muted-foreground)]">Subcategory</span>
                                                        <span className="font-medium">{product.subcategory}</span>
                                                    </div>
                                                )}
                                                {product.sku && (
                                                    <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                        <span className="text-[var(--muted-foreground)]">SKU</span>
                                                        <span className="font-medium">{product.sku}</span>
                                                    </div>
                                                )}
                                                {product.dimensions && (
                                                    <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                        <span className="text-[var(--muted-foreground)]">Dimensions</span>
                                                        <span className="font-medium">
                                                            {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height || 0} {product.dimensions.unit || "cm"}
                                                        </span>
                                                    </div>
                                                )}
                                                {product.weight && (
                                                    <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                        <span className="text-[var(--muted-foreground)]">Weight</span>
                                                        <span className="font-medium">{product.weight} kg</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {product.artworkDetails && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-lg">Artwork Information</h3>
                                                <div className="space-y-3">
                                                    {product.artworkDetails.medium && (
                                                        <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                            <span className="text-[var(--muted-foreground)]">Medium</span>
                                                            <span className="font-medium">{product.artworkDetails.medium}</span>
                                                        </div>
                                                    )}
                                                    {product.artworkDetails.style && (
                                                        <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                            <span className="text-[var(--muted-foreground)]">Style</span>
                                                            <span className="font-medium">{product.artworkDetails.style}</span>
                                                        </div>
                                                    )}
                                                    {product.artworkDetails.subject && (
                                                        <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                            <span className="text-[var(--muted-foreground)]">Subject</span>
                                                            <span className="font-medium">{product.artworkDetails.subject}</span>
                                                        </div>
                                                    )}
                                                    {product.artworkDetails.orientation && (
                                                        <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                            <span className="text-[var(--muted-foreground)]">Orientation</span>
                                                            <span className="font-medium capitalize">{product.artworkDetails.orientation}</span>
                                                        </div>
                                                    )}
                                                    {product.artworkDetails.yearCreated && (
                                                        <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                            <span className="text-[var(--muted-foreground)]">Year Created</span>
                                                            <span className="font-medium">{product.artworkDetails.yearCreated}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                        <span className="text-[var(--muted-foreground)]">Original</span>
                                                        <span className="font-medium">{product.artworkDetails.isOriginal ? "Yes" : "Print/Reproduction"}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-[var(--border)]">
                                                        <span className="text-[var(--muted-foreground)]">Framed</span>
                                                        <span className="font-medium">{product.artworkDetails.isFramed ? "Yes" : "No"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "shipping" && (
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Truck className="w-5 h-5 text-[var(--secondary-600)]" />
                                                Shipping Information
                                            </h3>
                                            <div className="space-y-4 text-[var(--muted-foreground)]">
                                                <p>We offer free standard shipping on all orders. Your item will be carefully packaged to ensure it arrives in perfect condition.</p>
                                                <ul className="space-y-2">
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                                                        Standard Shipping: 5-7 business days (Free)
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        Express Shipping: 2-3 business days (+$15)
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-purple-500 rounded-full" />
                                                        International Shipping: 10-15 business days (varies)
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <RotateCcw className="w-5 h-5 text-[var(--secondary-600)]" />
                                                Returns & Refunds
                                            </h3>
                                            <div className="space-y-4 text-[var(--muted-foreground)]">
                                                <p>We want you to be completely satisfied with your purchase. If you're not happy with your order, we offer hassle-free returns.</p>
                                                <ul className="space-y-2">
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-[var(--secondary-500)] rounded-full" />
                                                        30-day return window
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-[var(--secondary-500)] rounded-full" />
                                                        Free return shipping
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-[var(--secondary-500)] rounded-full" />
                                                        Full refund upon return
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-[var(--secondary-500)] rounded-full" />
                                                        Items must be in original condition
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "reviews" && (
                                <div className="space-y-8">
                                    {/* Review Summary */}
                                    <div className="grid md:grid-cols-3 gap-6">
                                        {/* Average Rating */}
                                        <div className="text-center p-6 bg-[var(--background)] rounded-xl">
                                            <div className="text-5xl font-bold text-[var(--secondary-600)] mb-2">{reviewStats.avgRating}</div>
                                            <div className="flex justify-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(parseFloat(reviewStats.avgRating)) ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-[var(--muted-foreground)]">Based on {reviewStats.totalReviews} reviews</p>
                                        </div>

                                        {/* Rating Distribution */}
                                        <div className="p-6 bg-[var(--background)] rounded-xl">
                                            <h4 className="font-medium mb-4">Rating Distribution</h4>
                                            <div className="space-y-2">
                                                {[5, 4, 3, 2, 1].map((rating) => {
                                                    const count = reviewStats.distribution[rating] || 0;
                                                    const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                                                    return (
                                                        <div key={rating} className="flex items-center gap-2 text-sm">
                                                            <span className="w-3">{rating}</span>
                                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                            <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-amber-500 rounded-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="w-8 text-right text-[var(--muted-foreground)]">{count}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Write Review CTA */}
                                        <div className="p-6 bg-[var(--background)] rounded-xl flex flex-col justify-center items-center text-center">
                                            <MessageSquare className="w-10 h-10 text-[var(--secondary-600)] mb-3" />
                                            <h4 className="font-medium mb-2">Share Your Experience</h4>
                                            <p className="text-sm text-[var(--muted-foreground)] mb-4">Help others by sharing your thoughts</p>
                                            {session?.user ? (
                                                <Button onClick={() => setShowReviewForm(true)} variant="secondary">
                                                    Write a Review
                                                </Button>
                                            ) : (
                                                <Link href="/login">
                                                    <Button variant="secondary">Log in to Review</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Success Message */}
                                    {submitSuccess && (
                                        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl">
                                            <Check className="w-5 h-5" />
                                            Your review has been submitted successfully!
                                        </div>
                                    )}

                                    {/* Review Form */}
                                    {showReviewForm && session?.user && (
                                        <div className="p-6 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-lg">Write Your Review</h4>
                                                <button onClick={() => setShowReviewForm(false)} className="p-1 hover:bg-[var(--muted)] rounded">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <form onSubmit={handleSubmitReview} className="space-y-4">
                                                {/* Rating Selection */}
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Your Rating</label>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((rating) => (
                                                            <button
                                                                key={rating}
                                                                type="button"
                                                                onClick={() => setNewReview({ ...newReview, rating })}
                                                                className="p-1 transition-transform hover:scale-110"
                                                            >
                                                                <Star className={`w-8 h-8 ${rating <= newReview.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Review Title (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={newReview.title}
                                                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                                        placeholder="Summarize your experience"
                                                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)]"
                                                        maxLength={150}
                                                    />
                                                </div>

                                                {/* Comment */}
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Your Review</label>
                                                    <textarea
                                                        value={newReview.comment}
                                                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                        placeholder="Share your experience with this product..."
                                                        rows={4}
                                                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)] resize-none"
                                                        maxLength={2000}
                                                        required
                                                    />
                                                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{newReview.comment.length}/2000 characters</p>
                                                </div>

                                                {submitError && (
                                                    <p className="text-red-500 text-sm">{submitError}</p>
                                                )}

                                                <div className="flex gap-3">
                                                    <Button type="submit" variant="secondary" disabled={submitting}>
                                                        {submitting ? "Submitting..." : "Submit Review"}
                                                        <Send className="w-4 h-4 ml-2" />
                                                    </Button>
                                                    <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Sort Reviews */}
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">Customer Reviews</h4>
                                        <select
                                            value={reviewSort}
                                            onChange={(e) => setReviewSort(e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)]"
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="highest">Highest Rated</option>
                                            <option value="lowest">Lowest Rated</option>
                                            <option value="helpful">Most Helpful</option>
                                        </select>
                                    </div>

                                    {/* Reviews List */}
                                    {reviewsLoading ? (
                                        <div className="text-center py-8 text-[var(--muted-foreground)]">Loading reviews...</div>
                                    ) : reviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {reviews.map((review) => (
                                                <div key={review._id} className="p-6 bg-[var(--background)] rounded-xl">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center overflow-hidden">
                                                            {review.user.avatar ? (
                                                                <img src={review.user.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium">{review.user.name}</span>
                                                                {review.isVerifiedPurchase && (
                                                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified Purchase</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                                                                    ))}
                                                                </div>
                                                                <span className="text-sm text-[var(--muted-foreground)]">
                                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            {review.title && <h5 className="font-medium mb-1">{review.title}</h5>}
                                                            <p className="text-[var(--muted-foreground)]">{review.comment}</p>
                                                            <div className="flex items-center gap-4 mt-3">
                                                                <button className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                                                                    <ThumbsUp className="w-4 h-4" />
                                                                    Helpful ({review.helpfulCount})
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-[var(--muted-foreground)]">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No reviews yet. Be the first to share your experience!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Related Products Section */}
                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-[var(--secondary-600)]" />
                                <h2 className="text-xl font-bold">You May Also Like</h2>
                            </div>
                            <Link href={`/marketplace?category=${product.category.toLowerCase()}`} className="text-sm text-[var(--secondary-600)] hover:underline">
                                View All →
                            </Link>
                        </div>

                        {relatedProducts && relatedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {relatedProducts.map((item: any) => (
                                    <Card key={item._id} hover className="overflow-hidden group">
                                        <Link href={`/marketplace/${item.slug}`} className="block aspect-square overflow-hidden relative">
                                            <img
                                                src={item.images?.find((i: any) => i.isPrimary)?.url || item.images?.[0]?.url || "https://placehold.co/400x400?text=Product"}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                        <CardContent className="p-4">
                                            <Link href={`/marketplace/${item.slug}`} className="font-medium text-sm line-clamp-2 hover:text-[var(--secondary-600)] transition-colors">
                                                {item.name}
                                            </Link>
                                            <p className="text-xs text-[var(--muted-foreground)] mt-1">by {item.seller?.name || "Studio"}</p>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="font-bold text-[var(--secondary-600)]">{formatPrice(item.price, item.currency || "INR")}</span>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                    <span className="text-xs">{item.rating?.toFixed(1) || "0.0"}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[var(--muted)]/50 rounded-2xl p-12 text-center">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 text-[var(--muted-foreground)] opacity-50" />
                                <h3 className="font-semibold mb-2">More products coming soon!</h3>
                                <p className="text-[var(--muted-foreground)] mb-4">Explore our marketplace for more amazing artwork.</p>
                                <Link href="/marketplace">
                                    <Button variant="secondary">Browse Marketplace</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
                    <div className="bg-[var(--background)] rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">Share this product</h3>
                            <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-[var(--muted)] rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex gap-4 justify-center mb-6">
                            <button onClick={() => handleShare("facebook")} className="p-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                <Facebook className="w-6 h-6" />
                            </button>
                            <button onClick={() => handleShare("twitter")} className="p-4 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors">
                                <Twitter className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={typeof window !== "undefined" ? window.location.href : ""}
                                readOnly
                                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-sm"
                            />
                            <Button onClick={() => handleShare("copy")} variant="secondary" className="shrink-0">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                        {copied && <p className="text-sm text-green-600 mt-2 text-center">Link copied to clipboard!</p>}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
