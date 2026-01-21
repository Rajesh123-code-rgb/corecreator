"use client";

import * as React from "react";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Loader2,
    Filter,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/atoms";
import { useConfirmModal } from "@/components/molecules";

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    data?: {
        link?: string;
        orderId?: string;
        courseId?: string;
    };
}

const NotificationIcon: Record<string, string> = {
    order_placed: "🛒",
    order_shipped: "📦",
    order_delivered: "✅",
    order_cancelled: "❌",
    payout_processed: "💰",
    payout_pending: "⏳",
    review_received: "⭐",
    course_enrolled: "📚",
    course_completed: "🎓",
    workshop_reminder: "🔔",
    product_approved: "✓",
    product_rejected: "✗",
    new_follower: "👤",
    message_received: "💬",
    system_announcement: "📢",
    promo_code_applied: "🎁",
    studio_verified: "✅",
    studio_rejected: "❌",
    course_approved: "✅",
    course_rejected: "❌",
    payout_requested: "💸",
};

export default function StudioNotificationsPage() {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [filter, setFilter] = React.useState<"all" | "unread">("all");
    const [actionLoading, setActionLoading] = React.useState(false);
    const confirmModal = useConfirmModal();
    const context = "studio";

    const fetchNotifications = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                context // Add context param
            });
            if (filter === "unread") {
                params.set("unread", "true");
            }

            const res = await fetch(`/api/notifications?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                setTotalPages(data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    React.useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAllRead = async () => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true, context }),
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark all read:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [id], context }),
            });
            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const deleteReadNotifications = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/notifications?deleteRead=true&context=${context}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => !n.read));
            }
        } catch (error) {
            console.error("Failed to delete notifications:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllRead}
                            disabled={actionLoading}
                        >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark all read
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmModal.confirm({
                            title: "Clear Read Notifications",
                            message: "Are you sure you want to delete all read notifications? This action cannot be undone.",
                            confirmText: "Clear All",
                            onConfirm: deleteReadNotifications,
                        })}
                        disabled={actionLoading}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear read
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setFilter("all"); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => { setFilter("unread"); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "unread"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No notifications</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {filter === "unread" ? "All caught up!" : "You have no notifications yet"}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`px-6 py-4 hover:bg-gray-50 transition-colors ${!notification.read ? "bg-purple-50/50" : ""
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <span className="text-2xl flex-shrink-0">
                                        {NotificationIcon[notification.type] || "📬"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification._id)}
                                                    className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg flex-shrink-0"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {formatTime(notification.createdAt)}
                                        </p>
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
