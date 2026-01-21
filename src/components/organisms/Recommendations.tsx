"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/molecules";
import { Star, Sparkles, BookOpen, ShoppingBag, Calendar, Loader2 } from "lucide-react";

interface RecommendationItem {
    type: "course" | "product" | "workshop";
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    slug: string;
    rating?: number;
    reason: string;
}

interface RecommendationsProps {
    title?: string;
    type?: "all" | "courses" | "products" | "workshops";
    limit?: number;
    context?: string;
    className?: string;
}

export function Recommendations({
    title = "Recommended for You",
    type = "all",
    limit = 8,
    context = "home",
    className = "",
}: RecommendationsProps) {
    const [recommendations, setRecommendations] = React.useState<RecommendationItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await fetch(
                    `/api/recommendations?type=${type}&limit=${limit}&context=${context}`
                );
                const data = await response.json();
                setRecommendations(data.recommendations || []);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [type, limit, context]);

    const getTypeIcon = (itemType: string) => {
        switch (itemType) {
            case "course": return <BookOpen className="w-3.5 h-3.5" />;
            case "product": return <ShoppingBag className="w-3.5 h-3.5" />;
            case "workshop": return <Calendar className="w-3.5 h-3.5" />;
            default: return null;
        }
    };

    const getResultLink = (item: RecommendationItem) => {
        switch (item.type) {
            case "course": return `/learn/${item.slug}`;
            case "product": return `/marketplace/${item.slug}`;
            case "workshop": return `/workshops/${item.slug}`;
            default: return "#";
        }
    };

    if (isLoading) {
        return (
            <div className={`flex justify-center py-12 ${className}`}>
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-500)]" />
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <section className={className}>
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-[var(--secondary-500)]" />
                <h2 className="text-xl font-bold">{title}</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((item) => (
                    <Link key={`${item.type}-${item.id}`} href={getResultLink(item)}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full group">
                            <div className="aspect-[4/3] relative overflow-hidden">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                        {getTypeIcon(item.type)}
                                    </div>
                                )}
                                <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
                                    {getTypeIcon(item.type)}
                                    <span className="capitalize">{item.type}</span>
                                </span>
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-[var(--secondary-600)] font-medium mb-1">
                                    {item.reason}
                                </p>
                                <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-[var(--secondary-600)] transition-colors">
                                    {item.title}
                                </h3>
                                {item.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                        {item.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[var(--secondary-600)]">
                                        ${item.price.toFixed(2)}
                                    </span>
                                    {item.rating !== undefined && item.rating > 0 && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span>{item.rating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}
