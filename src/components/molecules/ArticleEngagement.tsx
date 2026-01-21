"use client";

import { useState } from "react";
import { Eye, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";

interface EngagementMetrics {
    views: number;
    likes: number;
    comments: number;
    shares: number;
}

interface ArticleEngagementProps {
    metrics: EngagementMetrics;
    articleSlug: string;
}

const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
};

export const ArticleEngagement = ({ metrics, articleSlug }: ArticleEngagementProps) => {
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [localLikes, setLocalLikes] = useState(metrics.likes);

    const handleLike = () => {
        setLiked(!liked);
        setLocalLikes(liked ? localLikes - 1 : localLikes + 1);
        // TODO: API call to update likes
    };

    const handleBookmark = () => {
        setBookmarked(!bookmarked);
        // TODO: API call to save/unsave
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: document.title,
                    url: window.location.href,
                });
            } catch (err) {
                console.log("Share canceled");
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div className="flex items-center justify-between py-4 border-y border-[var(--border)]">
            {/* View Count */}
            <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {formatNumber(metrics.views)} views
                </span>

                <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {formatNumber(metrics.comments)}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${liked
                            ? "bg-red-100 text-red-600"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary-100)]"
                        }`}
                >
                    <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                    <span className="text-sm font-medium">{formatNumber(localLikes)}</span>
                </button>

                <button
                    onClick={handleBookmark}
                    className={`p-2 rounded-lg transition-all ${bookmarked
                            ? "bg-[var(--primary-100)] text-[var(--primary-600)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary-100)]"
                        }`}
                    aria-label="Bookmark"
                >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                </button>

                <button
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary-100)] transition-all"
                    aria-label="Share"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
