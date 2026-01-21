"use client";

import * as React from "react";
import {
    Users,
    ShoppingCart,
    Star,
    TrendingUp,
    Award,
    BookOpen,
    MessageSquare,
    DollarSign
} from "lucide-react";
import { Card } from "@/components/molecules";

interface Activity {
    id: string;
    type: "enrollment" | "purchase" | "review" | "milestone" | "comment";
    message: string;
    timestamp: Date;
    metadata?: {
        courseName?: string;
        studentName?: string;
        amount?: number;
        rating?: number;
    };
}

interface ActivityFeedProps {
    activities: Activity[];
}

const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
        case "enrollment":
            return <Users className="w-4 h-4 text-blue-600" />;
        case "purchase":
            return <ShoppingCart className="w-4 h-4 text-green-600" />;
        case "review":
            return <Star className="w-4 h-4 text-amber-500" />;
        case "milestone":
            return <Award className="w-4 h-4 text-purple-600" />;
        case "comment":
            return <MessageSquare className="w-4 h-4 text-gray-600" />;
        default:
            return <TrendingUp className="w-4 h-4 text-gray-600" />;
    }
};

const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (!activities || activities.length === 0) {
        return (
            <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--primary-600)]" />
                    Recent Activity
                </h3>
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Activity will appear here as students interact with your content</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--primary-600)]" />
                Recent Activity
            </h3>
            <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                {activity.message}
                            </p>
                            {activity.metadata && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                                    {activity.metadata.courseName && (
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {activity.metadata.courseName}
                                        </span>
                                    )}
                                    {activity.metadata.amount && (
                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                            <DollarSign className="w-3 h-3" />
                                            {activity.metadata.amount}
                                        </span>
                                    )}
                                    {activity.metadata.rating && (
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                            {activity.metadata.rating}/5
                                        </span>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                {getRelativeTime(activity.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {activities.length > 10 && (
                <div className="mt-4 text-center">
                    <button className="text-sm text-[var(--primary-600)] hover:underline">
                        View all activity
                    </button>
                </div>
            )}
        </Card>
    );
}
