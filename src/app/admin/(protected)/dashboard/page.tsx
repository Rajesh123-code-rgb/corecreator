"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import {
    Users,
    ShoppingBag,
    BookOpen,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Eye,
    Package,
    Loader2,
    MoreHorizontal,
    Plus,
    Calendar,
    ChevronDown,
    GraduationCap,
    Palette,
    Tag,
    FileText,
    Megaphone,
    Download,
    ExternalLink,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/atoms";

interface AdminStats {
    stats: {
        totalUsers: number;
        totalRevenue: number;
        activeCourses: number;
        productsListed: number;
    };
    recentUsers: Array<{ name: string; email: string; role: string; joinedAgo: string }>;
    recentOrders: Array<{ id: string; customer: string; amount: number; status: string; time: string }>;
    topProducts: Array<{ name: string; sales: number; revenue: number; type: string }>;
    activityFeed: Array<{ type: string; message: string; time: string; icon: string }>;
}

const CHART_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

// Mock monthly data for the area chart
const monthlyData = [
    { month: "Jan", revenue: 12000, orders: 45 },
    { month: "Feb", revenue: 19000, orders: 52 },
    { month: "Mar", revenue: 15000, orders: 48 },
    { month: "Apr", revenue: 25000, orders: 70 },
    { month: "May", revenue: 52940, orders: 95 },
    { month: "Jun", revenue: 35000, orders: 82 },
    { month: "Jul", revenue: 42000, orders: 88 },
    { month: "Aug", revenue: 38000, orders: 76 },
];

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [data, setData] = React.useState<AdminStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [createMenuOpen, setCreateMenuOpen] = React.useState(false);
    const [openCardMenu, setOpenCardMenu] = React.useState<string | null>(null);
    const createMenuRef = React.useRef<HTMLDivElement>(null);

    // Create menu options - links to pages with ?create=true to trigger create modal
    const createOptions = [
        { label: "New Product", href: "/admin/products?create=true", icon: Package, color: "text-purple-600 bg-purple-100" },
        { label: "New Course", href: "/admin/courses?create=true", icon: GraduationCap, color: "text-blue-600 bg-blue-100" },
        { label: "New Workshop", href: "/admin/workshops?create=true", icon: Palette, color: "text-green-600 bg-green-100" },
        { label: "New User", href: "/admin/users?create=true", icon: Users, color: "text-orange-600 bg-orange-100" },
        { label: "New Blog Post", href: "/admin/cms?create=true", icon: FileText, color: "text-pink-600 bg-pink-100" },
        { label: "New Promo Code", href: "/admin/promo-codes?create=true", icon: Tag, color: "text-teal-600 bg-teal-100" },
        { label: "New Banner", href: "/admin/banners?create=true", icon: Megaphone, color: "text-amber-600 bg-amber-100" },
    ];

    // Card menu options
    const cardMenuOptions: Record<string, { label: string; action: () => void; icon: React.ElementType }[]> = {
        earnings: [
            { label: "View Details", action: () => router.push("/admin/finance"), icon: ExternalLink },
            { label: "Export Report", action: () => router.push("/admin/reports"), icon: Download },
            { label: "Refresh Data", action: () => window.location.reload(), icon: RefreshCw },
        ],
        orders: [
            { label: "View All Orders", action: () => router.push("/admin/orders"), icon: ExternalLink },
            { label: "Export Orders", action: () => router.push("/admin/reports?type=sales"), icon: Download },
            { label: "Refresh Data", action: () => window.location.reload(), icon: RefreshCw },
        ],
        reports: [
            { label: "View Analytics", action: () => router.push("/admin/analytics"), icon: ExternalLink },
            { label: "Export Report", action: () => router.push("/admin/reports"), icon: Download },
            { label: "Refresh Data", action: () => window.location.reload(), icon: RefreshCw },
        ],
        platform: [
            { label: "View Products", action: () => router.push("/admin/products"), icon: Package },
            { label: "View Courses", action: () => router.push("/admin/courses"), icon: GraduationCap },
            { label: "View Users", action: () => router.push("/admin/users"), icon: Users },
        ],
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setCreateMenuOpen(false);
            }
            // Check if click is outside any card menu
            const target = event.target as HTMLElement;
            if (!target.closest('[data-card-menu]')) {
                setOpenCardMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats");
                if (res.ok) {
                    const jsonData = await res.json();
                    setData(jsonData);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const currentDate = new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    // Pie chart data for earnings distribution
    const earningsData = [
        { name: "Products", value: 35, color: "#8b5cf6" },
        { name: "Courses", value: 22, color: "#3b82f6" },
        { name: "Workshops", value: 7, color: "#10b981" },
        { name: "Other", value: 34, color: "#e5e7eb" },
    ];

    const totalRevenue = data?.stats.totalRevenue || 0;
    const totalOrders = data?.recentOrders?.length || 0;
    const totalUsers = data?.stats.totalUsers || 0;

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Welcome Back, {session?.user?.name || "Admin"}! 👋
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {currentDate} | {currentTime}
                    </p>
                </div>

                {/* Create New Dropdown */}
                <div className="relative" ref={createMenuRef}>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => setCreateMenuOpen(!createMenuOpen)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${createMenuOpen ? "rotate-180" : ""}`} />
                    </Button>

                    {/* Dropdown Menu */}
                    {createMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-3 py-2 border-b border-gray-100">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Quick Create</p>
                            </div>
                            {createOptions.map((option) => (
                                <button
                                    key={option.href}
                                    onClick={() => {
                                        router.push(option.href);
                                        setCreateMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className={`p-1.5 rounded-lg ${option.color}`}>
                                        <option.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <div className="flex gap-1">
                    <button
                        className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors bg-white border border-b-0 border-gray-200 text-gray-900"
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => router.push("/admin/analytics")}
                        className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => router.push("/admin/products")}
                        className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    >
                        Products
                    </button>
                    <button
                        onClick={() => router.push("/admin/orders")}
                        className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    >
                        Orders
                    </button>
                    <button
                        onClick={() => router.push("/admin/users")}
                        className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    >
                        Users
                    </button>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Stats + Chart */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Two Stat Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Total Earning */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-600 font-medium">Total Earning</h3>
                                <div className="relative" data-card-menu>
                                    <button
                                        onClick={() => setOpenCardMenu(openCardMenu === "earnings" ? null : "earnings")}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    {openCardMenu === "earnings" && (
                                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                            {cardMenuOptions.earnings.map((item) => (
                                                <button
                                                    key={item.label}
                                                    onClick={() => { item.action(); setOpenCardMenu(null); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <item.icon className="w-4 h-4 text-gray-400" />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        ₹{totalRevenue.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {totalOrders} orders
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                    <TrendingUp className="w-4 h-4" />
                                    +12.08%
                                </div>
                            </div>
                            {/* Mini Sparkline */}
                            <div className="h-12 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData.slice(-5)}>
                                        <defs>
                                            <linearGradient id="earningGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#8b5cf6"
                                            fill="url(#earningGradient)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Total Orders/Spending */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-600 font-medium">Total Orders</h3>
                                <div className="relative" data-card-menu>
                                    <button
                                        onClick={() => setOpenCardMenu(openCardMenu === "orders" ? null : "orders")}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    {openCardMenu === "orders" && (
                                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                            {cardMenuOptions.orders.map((item) => (
                                                <button
                                                    key={item.label}
                                                    onClick={() => { item.action(); setOpenCardMenu(null); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <item.icon className="w-4 h-4 text-gray-400" />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {(data?.stats.productsListed || 0) + (data?.stats.activeCourses || 0)}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {totalOrders} this month
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                                    <TrendingDown className="w-4 h-4" />
                                    -15.08%
                                </div>
                            </div>
                            {/* Mini Sparkline */}
                            <div className="h-12 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData.slice(-5)}>
                                        <defs>
                                            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area
                                            type="monotone"
                                            dataKey="orders"
                                            stroke="#6b7280"
                                            fill="url(#ordersGradient)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Activity Chart */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Monthly Activity</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                                    Revenue
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                                    Orders
                                </div>
                            </div>
                        </div>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`₹${(value as number || 0).toLocaleString()}`, "Revenue"]}
                                        contentStyle={{
                                            background: "#1f2937",
                                            border: "none",
                                            borderRadius: "8px",
                                            color: "#fff"
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8b5cf6"
                                        fill="url(#revenueGradient)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column - Earning Reports + Campaign */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Earning Reports - Donut Chart */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Earning Reports</h3>
                            <div className="relative" data-card-menu>
                                <button
                                    onClick={() => setOpenCardMenu(openCardMenu === "reports" ? null : "reports")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {openCardMenu === "reports" && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                        {cardMenuOptions.reports.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => { item.action(); setOpenCardMenu(null); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <item.icon className="w-4 h-4 text-gray-400" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Donut Chart */}
                            <div className="relative w-32 h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={earningsData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={50}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {earningsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-lg font-bold text-gray-900">68%</p>
                                    <p className="text-xs text-gray-500">Total Sales</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-purple-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Total Orders</p>
                                        <p className="font-semibold">{totalOrders}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Total Users</p>
                                        <p className="font-semibold">{totalUsers}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Revenue</p>
                                        <p className="font-semibold">₹{totalRevenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Campaign / Quick Stats */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Platform Stats</h3>
                            <div className="relative" data-card-menu>
                                <button
                                    onClick={() => setOpenCardMenu(openCardMenu === "platform" ? null : "platform")}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {openCardMenu === "platform" && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                        {cardMenuOptions.platform.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => { item.action(); setOpenCardMenu(null); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <item.icon className="w-4 h-4 text-gray-400" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center mb-4">
                            <p className="text-4xl font-bold text-gray-900">
                                {(data?.stats.productsListed || 0) + (data?.stats.activeCourses || 0)}
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-green-600 text-sm font-medium">↗ +12.08%</span>
                                <span className="text-gray-400 text-sm">than last week</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                            <div className="h-full bg-purple-600" style={{ width: "40%" }}></div>
                            <div className="h-full bg-blue-500" style={{ width: "35%" }}></div>
                            <div className="h-full bg-green-500" style={{ width: "25%" }}></div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                                    <span className="text-sm text-gray-600">Products</span>
                                </div>
                                <span className="text-sm font-medium">{data?.stats.productsListed || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    <span className="text-sm text-gray-600">Courses</span>
                                </div>
                                <span className="text-sm font-medium">{data?.stats.activeCourses || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span className="text-sm text-gray-600">Users</span>
                                </div>
                                <span className="text-sm font-medium">{data?.stats.totalUsers || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Recent Orders & Top Products */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                        <Link href="/admin/orders" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                                    <th className="px-4 py-3 font-medium">Order ID</th>
                                    <th className="px-4 py-3 font-medium">Customer</th>
                                    <th className="px-4 py-3 font-medium">Amount</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data?.recentOrders?.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="text-sm hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-purple-600">{order.id}</td>
                                        <td className="px-4 py-3 text-gray-600">{order.customer}</td>
                                        <td className="px-4 py-3 font-medium">₹{order.amount.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${order.status === "completed" || order.status === "paid"
                                                ? "bg-green-100 text-green-700"
                                                : order.status === "pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white rounded-xl border border-gray-100">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Users</h3>
                        <Link href="/admin/users" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {data?.recentUsers?.slice(0, 5).map((user, index) => (
                            <div key={index} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-medium">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${user.role === "studio"
                                    ? "bg-purple-100 text-purple-700"
                                    : user.role === "admin"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
