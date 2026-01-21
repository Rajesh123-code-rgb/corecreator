"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { useConfirmModal } from "@/components/molecules";
import {
    Star,
    Search,
    Loader2,
    CheckCircle,
    XCircle,
    Flag,
    Trash2,
    MoreHorizontal,
    Eye,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    AlertTriangle
} from "lucide-react";

interface Review {
    _id: string;
    targetType: string;
    targetId: string;
    user: { _id: string; name: string; email: string; avatar?: string };
    rating: number;
    title?: string;
    comment: string;
    status: "pending" | "approved" | "rejected" | "flagged";
    isVerifiedPurchase: boolean;
    createdAt: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState({ pending: 0, approved: 0, rejected: 0, flagged: 0, total: 0 });
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [targetFilter, setTargetFilter] = React.useState("all");
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);
    const confirmModal = useConfirmModal();

    const fetchReviews = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                status: statusFilter,
                targetType: targetFilter,
            });

            const res = await fetch(`/api/admin/reviews?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
                setStats(data.stats || { pending: 0, approved: 0, rejected: 0, flagged: 0, total: 0 });
                setTotalPages(data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, targetFilter]);

    React.useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleAction = async (reviewId: string, status: string) => {
        setActionLoading(reviewId);
        try {
            const res = await fetch("/api/admin/reviews", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reviewId, status }),
            });
            if (res.ok) {
                setReviews(prev => prev.map(r =>
                    r._id === reviewId ? { ...r, status: status as Review["status"] } : r
                ));
            }
        } catch (error) {
            console.error("Failed to update review:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (reviewId: string) => {
        setActionLoading(reviewId);
        try {
            const res = await fetch(`/api/admin/reviews?id=${reviewId}`, { method: "DELETE" });
            if (res.ok) {
                setReviews(prev => prev.filter(r => r._id !== reviewId));
            }
        } catch (error) {
            console.error("Failed to delete review:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-700",
            approved: "bg-green-100 text-green-700",
            rejected: "bg-red-100 text-red-700",
            flagged: "bg-orange-100 text-orange-700"
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
                <p className="text-gray-500 mt-1">Manage and moderate user reviews</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500">Total Reviews</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
                            <p className="text-xs text-gray-500">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{stats.rejected}</p>
                            <p className="text-xs text-gray-500">Rejected</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Flag className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{stats.flagged}</p>
                            <p className="text-xs text-gray-500">Flagged</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex gap-2">
                            {["all", "pending", "approved", "rejected", "flagged"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                        <select
                            value={targetFilter}
                            onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="all">All Types</option>
                            <option value="product">Products</option>
                            <option value="course">Courses</option>
                            <option value="workshop">Workshops</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No reviews found
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                                                    {review.user?.avatar ? (
                                                        <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        review.user?.name?.charAt(0) || "?"
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900">{review.user?.name || "Unknown"}</p>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{review.comment}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{renderStars(review.rating)}</td>
                                        <td className="px-6 py-4 text-sm capitalize text-gray-600">{review.targetType}</td>
                                        <td className="px-6 py-4">{getStatusBadge(review.status)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {actionLoading === review._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        {review.status !== "approved" && (
                                                            <button
                                                                onClick={() => handleAction(review._id, "approved")}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {review.status !== "rejected" && (
                                                            <button
                                                                onClick={() => handleAction(review._id, "rejected")}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => confirmModal.confirm({
                                                                title: "Delete Review",
                                                                message: "Delete this review permanently? This action cannot be undone.",
                                                                confirmText: "Delete",
                                                                onConfirm: () => handleDelete(review._id),
                                                            })}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
