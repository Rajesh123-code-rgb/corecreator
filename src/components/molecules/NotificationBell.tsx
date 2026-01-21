"use client";

import * as React from "react";
import { Bell, Check } from "lucide-react";
import Link from "next/link";

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    data?: {
        link?: string;
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

interface NotificationBellProps {
    context?: "user" | "studio" | "admin";
}

export default function NotificationBell({ context = "user" }: NotificationBellProps) {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Determine link destination based on context
    const viewAllLink = {
        user: "/user/notifications",
        studio: "/studio/notifications",
        admin: "/admin/notifications",
    }[context];

    // Fetch notifications
    const fetchNotifications = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/notifications?limit=5&context=${context}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [context]);

    React.useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAllRead = async () => {
        setLoading(true);
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
            setLoading(false);
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

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                disabled={loading}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.read ? "bg-purple-50/50" : ""
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-lg flex-shrink-0">
                                            {NotificationIcon[notification.type] || "📬"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.read ? "font-medium text-gray-900" : "text-gray-700"}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-gray-400">
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                                {!notification.read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification._id);
                                                        }}
                                                        className="text-xs text-purple-600 hover:text-purple-700"
                                                    >
                                                        Mark read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <Link
                        href={viewAllLink}
                        className="block px-4 py-3 text-center text-sm text-purple-600 hover:bg-purple-50 font-medium border-t border-gray-100"
                        onClick={() => setIsOpen(false)}
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}
