"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    Star,
    Loader2,
    MessageCircle,
    Send,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    ThumbsUp,
    ThumbsDown
} from "lucide-react";

interface Review {
    _id: string;
    targetType: string;
    targetId: string;
    user: { _id: string; name: string; avatar?: string };
    rating: number;
    title?: string;
    comment: string;
    status: string;
    isVerifiedPurchase: boolean;
    sellerResponse?: { comment: string; respondedAt: string };
    createdAt: string;
}

export default function StudioReviewsPage() {
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [stats, setStats] = React.useState({ avgRating: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
    const [replyText, setReplyText] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    const fetchReviews = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/studio/reviews?page=${page}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
                setStats(data.stats || { avgRating: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
                setTotalPages(data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/studio/reviews/reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewId, comment: replyText }),
            });
            if (res.ok) {
                setReplyingTo(null);
                setReplyText("");
                fetchReviews();
            }
        } catch (error) {
            console.error("Failed to reply:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, size = "w-4 h-4") => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${size} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
            ))}
        </div>
    );

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                <p className="text-gray-500 mt-1">Manage and respond to customer reviews</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Average Rating */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</div>
                        <div>
                            {renderStars(Math.round(stats.avgRating), "w-5 h-5")}
                            <p className="text-sm text-gray-500 mt-1">{stats.total} reviews</p>
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2">
                    <h3 className="font-medium mb-4">Rating Distribution</h3>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.distribution[rating as keyof typeof stats.distribution] || 0;
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <span className="w-3 text-sm text-gray-600">{rating}</span>
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-sm text-gray-500 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold">All Reviews</h3>
                </div>

                {loading ? (
                    <div className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No reviews yet</p>
                        <p className="text-sm text-gray-400 mt-1">Reviews from customers will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reviews.map((review) => (
                            <div key={review._id} className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                                        {review.user?.avatar ? (
                                            <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            review.user?.name?.charAt(0) || "?"
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{review.user?.name}</p>
                                                    {review.isVerifiedPurchase && (
                                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                            Verified Purchase
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {renderStars(review.rating)}
                                                    <span className="text-sm text-gray-400">{formatTime(review.createdAt)}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded capitalize">
                                                {review.targetType}
                                            </span>
                                        </div>

                                        {review.title && (
                                            <p className="font-medium text-gray-900 mt-3">{review.title}</p>
                                        )}
                                        <p className="text-gray-600 mt-2">{review.comment}</p>

                                        {/* Seller Response */}
                                        {review.sellerResponse ? (
                                            <div className="mt-4 pl-4 border-l-2 border-purple-200 bg-purple-50/50 rounded-r-lg p-3">
                                                <p className="text-sm font-medium text-purple-700 mb-1">Your Response</p>
                                                <p className="text-sm text-gray-600">{review.sellerResponse.comment}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTime(review.sellerResponse.respondedAt)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                {replyingTo === review._id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            placeholder="Write your response..."
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                                            rows={3}
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setReplyingTo(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleReply(review._id)}
                                                                disabled={submitting || !replyText.trim()}
                                                            >
                                                                {submitting ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                ) : (
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                )}
                                                                Send Reply
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setReplyingTo(review._id)}
                                                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        Reply to this review
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
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
                )}
            </div>
        </div>
    );
}
