"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, StatusFilterTabs, ActivityFeed } from "@/components/molecules";
import { Button } from "@/components/atoms";
import {
    BookOpen,
    Package,
    Users,
    DollarSign,
    TrendingUp,
    Eye,
    Star,
    ArrowRight,
    Plus,
    ShoppingCart,
    Loader2
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface CreatorStats {
    stats: {
        totalStudents: number;
        coursesPublished: number;
        coursesDraft: number;
        coursesReview: number;
        artworksListed: number;
        revenue: number;
    };
    recentCourses: Array<{ title: string; students: number; rating: number; revenue: number; status: string }>;
    recentProducts: Array<{ title: string; price: number; views: number; sales: number; status: string }>;
    recentOrders: Array<{ id: string; customer: string; product: string; amount: number; type: string }>;
    recentActivity: Array<{
        id: string;
        type: "enrollment" | "purchase" | "review" | "milestone" | "comment";
        message: string;
        timestamp: Date;
        metadata?: any;
    }>;
}

export default function StudioDashboard() {
    const { data: session } = useSession();
    const { formatPrice } = useCurrency();
    const [data, setData] = React.useState<CreatorStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft" | "review">("all");

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/studio/stats");
                if (res.ok) {
                    const jsonData = await res.json();
                    setData(jsonData);
                }
            } catch (error) {
                console.error("Failed to fetch studio stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Filter courses based on status
    const filteredCourses = React.useMemo(() => {
        if (!data?.recentCourses) return [];
        if (statusFilter === "all") return data.recentCourses;
        return data.recentCourses.filter(course => course.status === statusFilter);
    }, [data, statusFilter]);

    const courseCounts = {
        all: data?.recentCourses?.length || 0,
        published: data?.stats.coursesPublished || 0,
        draft: data?.stats.coursesDraft || 0,
        review: data?.stats.coursesReview || 0,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
            </div>
        );
    }

    const stats = [
        { label: "Total Students", value: data?.stats.totalStudents || 0, change: "+0%", icon: Users, color: "bg-blue-100 text-blue-600" },
        { label: "Courses Published", value: data?.stats.coursesPublished || 0, change: "+0", icon: BookOpen, color: "bg-purple-100 text-purple-600" },
        { label: "Artworks Listed", value: data?.stats.artworksListed || 0, change: "+0", icon: Package, color: "bg-amber-100 text-amber-600" },
        { label: "Total Revenue", value: formatPrice(data?.stats.revenue || 0, "INR"), change: "+0%", icon: DollarSign, color: "bg-green-100 text-green-600" },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="gradient-gold rounded-2xl p-6 lg:p-8 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                            Welcome to Your Studio, {session?.user?.name?.split(" ")[0]}! 🎨
                        </h1>
                        <p className="text-white/80">
                            You currently have {data?.stats.coursesPublished} courses and {data?.stats.artworksListed} artworks active.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button size="lg" className="bg-white text-amber-700 hover:bg-white/90" asChild>
                            <Link href="/studio/courses/new">
                                <Plus className="w-5 h-5 mr-2" />
                                New Course
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                            <Link href="/studio/products/new">
                                <Plus className="w-5 h-5 mr-2" />
                                New Artwork
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                {/* Change trends hardcoded to 0 for now as we don't have historical data */}
                            </div>
                            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* My Courses with Filter - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <Card className="flex flex-col h-full">
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                            <h2 className="font-semibold flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                                My Courses
                            </h2>
                            <Link href="/studio/courses" className="text-sm text-[var(--primary-600)] hover:underline flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <StatusFilterTabs
                            activeFilter={statusFilter}
                            onFilterChange={setStatusFilter}
                            counts={courseCounts}
                        />

                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-[var(--border)]">
                                {filteredCourses && filteredCourses.length > 0 ? (
                                    filteredCourses.map((course, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/50">
                                            <div>
                                                <p className="font-medium text-sm">{course.title}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students}</span>
                                                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{course.rating}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-green-600">{formatPrice(course.revenue, "INR")}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${course.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {course.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                                        No {statusFilter !== "all" ? statusFilter : ""} courses found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Feed - Takes 1 column */}
                <div className="lg:col-span-1">
                    <ActivityFeed activities={data?.recentActivity || []} />
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* My Artworks */}
                <Card className="flex flex-col h-full">
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-600" />
                            My Artworks
                        </h2>
                        <Link href="/studio/products" className="text-sm text-[var(--primary-600)] hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <CardContent className="p-0">
                        <div className="divide-y divide-[var(--border)]">
                            {data?.recentProducts && data.recentProducts.length > 0 ? (
                                data.recentProducts.map((product, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/50">
                                        <div>
                                            <p className="font-medium text-sm">{product.title}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted-foreground)]">
                                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{product.views} views</span>
                                                <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" />{product.sales} sold</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatPrice(product.price, "INR")}</p>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{product.status}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">No artworks found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>


                {/* Recent Orders */}
                <Card>
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="font-semibold">Recent Sales</h2>
                        <Link href="/studio/earnings" className="text-sm text-[var(--primary-600)] hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
                                    <tr>
                                        <th className="text-left px-4 py-3">Order</th>
                                        <th className="text-left px-4 py-3">Customer</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">Product</th>
                                        <th className="text-left px-4 py-3">Type</th>
                                        <th className="text-right px-4 py-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {data?.recentOrders && data.recentOrders.length > 0 ? (
                                        data.recentOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-[var(--muted)]/50">
                                                <td className="px-4 py-3 font-medium text-sm text-[var(--primary-600)]">{order.id}</td>
                                                <td className="px-4 py-3 text-sm">{order.customer}</td>
                                                <td className="px-4 py-3 text-sm hidden md:table-cell truncate max-w-[200px]">{order.product}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${order.type === "course" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>
                                                        {order.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-green-600">{formatPrice(order.amount, "INR")}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-sm text-[var(--muted-foreground)]">No recent sales.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
