"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/atoms";
import {
    Star,
    MessageSquare,
    ThumbsUp,
    Send,
    User,
    X,
    Check,
    Loader2
} from "lucide-react";

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

interface ReviewsSectionProps {
    targetId: string;
    targetType: "product" | "course" | "workshop";
    initialStats?: ReviewStats;
}

export function ReviewsSection({ targetId, targetType, initialStats }: ReviewsSectionProps) {
    const { data: session } = useSession();

    // Review state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewStats, setReviewStats] = useState<ReviewStats>(initialStats || {
        avgRating: "0.0",
        totalReviews: 0,
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

    // Fetch reviews
    const fetchReviews = async () => {
        try {
            setReviewsLoading(true);
            const res = await fetch(`/api/reviews?targetType=${targetType}&targetId=${targetId}&sort=${reviewSort}&limit=10`);
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

    useEffect(() => {
        if (targetId) {
            fetchReviews();
        }
    }, [targetId, targetType, reviewSort]);

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
                    targetType,
                    targetId,
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

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">
                Student Reviews
                <span className="ml-2 text-lg text-gray-500 font-normal">({reviewStats.totalReviews})</span>
            </h2>

            {/* Review Summary */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Average Rating */}
                <div className="text-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <div className="text-5xl font-bold text-purple-600 mb-2">{reviewStats.avgRating}</div>
                    <div className="flex justify-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.floor(parseFloat(reviewStats.avgRating)) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500">Based on {reviewStats.totalReviews} reviews</p>
                </div>

                {/* Rating Distribution */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <h4 className="font-medium mb-4 text-gray-900">Rating Distribution</h4>
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = reviewStats.distribution[rating] || 0;
                            const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                            return (
                                <div key={rating} className="flex items-center gap-2 text-sm">
                                    <span className="w-3 text-gray-700 font-medium">{rating}</span>
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-gray-500">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Write Review CTA */}
                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
                    <MessageSquare className="w-10 h-10 text-purple-600 mb-3" />
                    <h4 className="font-medium mb-2 text-gray-900">Share Your Experience</h4>
                    <p className="text-sm text-gray-500 mb-4">Help others by sharing your thoughts</p>
                    {session?.user ? (
                        <Button onClick={() => setShowReviewForm(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                            Write a Review
                        </Button>
                    ) : (
                        <Link href="/login">
                            <Button variant="outline">Log in to Review</Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Success Message */}
            {submitSuccess && (
                <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                    <Check className="w-5 h-5" />
                    Your review has been submitted successfully!
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && session?.user && (
                <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg text-gray-900">Write Your Review</h4>
                        <button onClick={() => setShowReviewForm(false)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        {/* Rating Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Your Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, rating })}
                                        className="p-1 transition-transform hover:scale-110"
                                    >
                                        <Star className={`w-8 h-8 ${rating <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Review Title (Optional)</label>
                            <input
                                type="text"
                                value={newReview.title}
                                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                                placeholder="Summarize your experience"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                maxLength={150}
                            />
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Your Review</label>
                            <textarea
                                value={newReview.comment}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                placeholder="Share your experience with this course..."
                                rows={4}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                maxLength={2000}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">{newReview.comment.length}/2000 characters</p>
                        </div>

                        {submitError && (
                            <p className="text-red-500 text-sm">{submitError}</p>
                        )}

                        <div className="flex gap-3">
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                {submitting ? "Submitting..." : "Submit Review"}
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
                <h4 className="font-semibold text-gray-900">Student Reviews</h4>
                <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : reviews.length > 0 ? (
                <div className="grid gap-6">
                    {reviews.map((review) => (
                        <div key={review._id} className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {review.user.avatar ? (
                                        <img src={review.user.avatar} alt={review.user.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                            {review.user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-900">{review.user.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                            {review.isVerifiedPurchase && (
                                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-2">Enrolled Student</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            {review.title && <h4 className="font-bold text-gray-900 mb-2">{review.title}</h4>}
                            <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                            <div className="flex items-center gap-4 mt-3">
                                <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-900">
                                    <ThumbsUp className="w-4 h-4" />
                                    Helpful ({review.helpfulCount})
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="flex justify-center mb-4">
                        <MessageSquare className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Be the first to leave a review for this course! Enroll now to share your experience.
                    </p>
                </div>
            )}
        </div>
    );
}
