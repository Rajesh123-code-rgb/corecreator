"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent } from "@/components/molecules";
import {
    BookOpen,
    ShoppingBag,
    Clock,
    Award,
    TrendingUp,
    PlayCircle,
    ArrowRight,
    Star,
    Loader2,
} from "lucide-react";

interface EnrolledCourse {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    instructor: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
}

interface Recommendation {
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    slug: string;
    rating?: number;
    reason: string;
    type: string;
    instructor?: string; // Not in API response interface yet? Wait, API returns "title", "description", etc. Instructor is not in API response for recommendations.
}

export default function UserDashboard() {
    const { data: session } = useSession();
    const { t, language } = useLanguage();
    const [courses, setCourses] = React.useState<EnrolledCourse[]>([]);
    const [orders, setOrders] = React.useState<any[]>([]); // Using any for briefness or define interface
    const [workshops, setWorkshops] = React.useState<any[]>([]);
    const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, ordersRes, workshopsRes, recommendationsRes] = await Promise.all([
                    fetch("/api/user/courses"),
                    fetch("/api/user/orders"),
                    fetch("/api/user/workshops"),
                    fetch("/api/recommendations?limit=2&type=courses")
                ]);

                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(data.courses || []);
                }

                if (ordersRes.ok) {
                    const data = await ordersRes.json();
                    setOrders(data.orders || []);
                }

                if (workshopsRes.ok) {
                    const data = await workshopsRes.json();
                    setWorkshops(data.workshops || []);
                }

                if (recommendationsRes.ok) {
                    const data = await recommendationsRes.json();
                    setRecommendations(data.recommendations || []);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const stats = [
        { label: t("stats.enrolled"), value: courses.length.toString(), icon: BookOpen, color: "bg-blue-100 text-blue-600" },
        { label: t("stats.completed"), value: courses.filter(c => c.progress === 100).length.toString(), icon: Award, color: "bg-green-100 text-green-600" },
        { label: t("stats.workshops"), value: workshops.length.toString(), icon: Clock, color: "bg-amber-100 text-amber-600" },
        { label: t("stats.orders"), value: orders.length.toString(), icon: ShoppingBag, color: "bg-purple-100 text-purple-600" },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="gradient-primary rounded-2xl p-6 lg:p-8 text-white">
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                    {t("dashboard.welcome")}, {session?.user?.name?.split(" ")[0] || "Learner"}! 👋
                </h1>
                <p className="text-white/80 mb-4">
                    {language === 'hi'
                        ? `अपनी रचनात्मक यात्रा जारी रखें। आपके पास प्रगति में ${courses.filter(c => c.progress > 0 && c.progress < 100).length} पाठ्यक्रम हैं।`
                        : `Continue your creative journey. You have ${courses.filter(c => c.progress > 0 && c.progress < 100).length} courses in progress.`
                    }
                </p>
                <div className="flex gap-3">
                    <Link
                        href="/user/courses"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[var(--secondary-700)] rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                        <PlayCircle className="w-4 h-4" />
                        {t("dashboard.my_courses")}
                    </Link>
                    <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--secondary-600)] text-white border border-white/20 rounded-lg font-medium text-sm hover:bg-[var(--secondary-500)] transition-colors"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        {t("dashboard.marketplace")}
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Courses */}
                <Card className="flex flex-col h-full">
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="font-semibold">{t("dashboard.continue_learning")}</h2>
                        <Link href="/user/courses" className="text-sm text-[var(--secondary-600)] hover:underline flex items-center gap-1">
                            {t("dashboard.view_all")} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <CardContent className="p-4 space-y-4 flex-1">
                        {courses.length > 0 ? (
                            courses.slice(0, 3).map((course) => (
                                <Link key={course.id} href={`/learn/${course.slug}/player`} className="flex items-center gap-4 group p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
                                    <div className="relative">
                                        <img src={course.thumbnail} alt={course.title} className="w-16 h-12 rounded-lg object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlayCircle className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate group-hover:text-[var(--secondary-600)] transition-colors">{course.title}</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">by {course.instructor}</p>
                                        <div className="mt-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--secondary-500)]"
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-[var(--secondary-600)]">{course.progress}%</span>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
                                {t("dashboard.no_courses")}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Orders / Workshops */}
                <Card className="flex flex-col h-full">
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[var(--secondary-500)]" />
                            {t("dashboard.upcoming_workshops")}
                        </h2>
                    </div>
                    <CardContent className="p-4 space-y-4 flex-1">
                        {workshops.length > 0 ? (
                            workshops.slice(0, 3).map((workshop) => (
                                <Link key={workshop._id} href={`/workshops/${workshop.slug}`} className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-[var(--muted-foreground)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate group-hover:text-[var(--secondary-600)] transition-colors">{workshop.title}</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">
                                            {new Date(workshop.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
                                <p className="mb-2">{t("dashboard.no_workshops")}</p>
                                <Link href="/workshops" className="text-[var(--secondary-600)] hover:underline">{t("dashboard.browse_workshops")}</Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders Section */}
            <div className="grid grid-cols-1">
                <Card>
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="font-semibold">{t("dashboard.recent_orders")}</h2>
                        <Link href="/user/orders" className="text-sm text-[var(--secondary-600)] hover:underline flex items-center gap-1">
                            {t("dashboard.view_all")} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <CardContent className="p-0">
                        {orders.length > 0 ? (
                            <div className="divide-y divide-[var(--border)]">
                                {orders.slice(0, 3).map((order) => (
                                    <div key={order._id} className="p-4 flex items-center justify-between hover:bg-[var(--muted)] transition-colors">
                                        <div>
                                            <p className="font-medium text-sm">{order.orderNumber}</p>
                                            <p className="text-xs text-[var(--muted-foreground)]">
                                                {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} {t("common.items")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                            <p className="font-bold text-sm">${order.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
                                {t("dashboard.no_orders")}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
