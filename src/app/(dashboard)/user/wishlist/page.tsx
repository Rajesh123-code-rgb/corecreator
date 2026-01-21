"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { Heart, Loader2, ShoppingBag, BookOpen, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

interface WishlistItem {
    id: string;
    type: "course" | "product";
    addedAt: string;
    details: {
        _id: string;
        title: string;
        slug: string;
        image: string;
        price: number;
        subtitle: string;
    };
}

export default function WishlistPage() {
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const [wishlist, setWishlist] = React.useState<WishlistItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const res = await fetch("/api/user/wishlist");
                if (res.ok) {
                    const data = await res.json();
                    setWishlist(data.wishlist || []);
                }
            } catch (error) {
                console.error("Failed to fetch wishlist:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, []);

    const removeFromWishlist = async (itemId: string, itemType: string) => {
        // Optimistic update
        setWishlist(prev => prev.filter(item => item.id !== itemId));

        try {
            const res = await fetch("/api/user/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, itemType }),
            });

            if (!res.ok) {
                console.error("Failed to remove from wishlist");
                // Revert optimistic update by reloading window or show toast
                // customized error handling can be added here
            }
        } catch (error) {
            console.error("Failed to remove item", error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t("dashboard.wishlist.title")}</h1>

            {wishlist.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Heart className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                        <h3 className="text-lg font-medium mb-1">{t("dashboard.wishlist.empty_title")}</h3>
                        <p className="text-[var(--muted-foreground)] mb-4">
                            {t("dashboard.wishlist.empty_desc")}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button variant="outline" asChild>
                                <Link href="/marketplace">{t("dashboard.orders.browse_products")}</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/learn">{t("dashboard.courses.browse")}</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                        <Card key={item.id} className="group overflow-hidden flex flex-col h-full relative">
                            <button
                                onClick={() => removeFromWishlist(item.id, item.type)}
                                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 hover:bg-white transition-colors z-10 opactiy-0 group-hover:opacity-100"
                                title="Remove from wishlist"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <Link href={item.type === 'course' ? `/learn/${item.details.slug}` : `/marketplace/${item.details.slug}`} className="relative aspect-video overflow-hidden block">
                                <img
                                    src={item.details.image}
                                    alt={item.details.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded uppercase flex items-center gap-1">
                                    {item.type === 'course' ? <BookOpen className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                                    {item.type}
                                </div>
                            </Link>

                            <CardContent className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-[var(--secondary-600)] transition-colors">
                                    <Link href={item.type === 'course' ? `/learn/${item.details.slug}` : `/marketplace/${item.details.slug}`}>
                                        {item.details.title}
                                    </Link>
                                </h3>
                                <p className="text-sm text-[var(--muted-foreground)] mb-3">{item.details.subtitle}</p>

                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-bold text-lg">{formatPrice(item.details.price)}</span>
                                    <Button size="sm" variant="secondary" asChild>
                                        <Link href={item.type === 'course' ? `/learn/${item.details.slug}` : `/marketplace/${item.details.slug}`}>
                                            {t("dashboard.workshops.view_details")}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
