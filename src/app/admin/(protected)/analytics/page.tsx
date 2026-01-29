"use client";

import * as React from "react";
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Loader2, TrendingUp, Users, ShoppingBag, DollarSign, ArrowUp, ArrowDown, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/atoms";
import { useCurrency } from "@/context/CurrencyContext";

interface AnalyticsData {
    date: string;
    revenue: number;
    orders: number;
    users: number;
}

interface AnalyticsTotals {
    revenue: number;
    users: number;
    orders: number;
}

interface FunnelStep {
    stage: string;
    count: number;
    fill: string;
}

interface AttributionSource {
    source: string;
    count: number;
    revenue: number;
    [key: string]: any;
}

const CHART_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function AdminAnalyticsPage() {
    const [activeTab, setActiveTab] = React.useState("overview");
    const [period, setPeriod] = React.useState("30d");

    // Data State
    const { formatPrice, symbol } = useCurrency();
    const [data, setData] = React.useState<AnalyticsData[]>([]);
    const [totals, setTotals] = React.useState<AnalyticsTotals>({ revenue: 0, users: 0, orders: 0 });
    const [funnelData, setFunnelData] = React.useState<FunnelStep[]>([]);
    const [attributionData, setAttributionData] = React.useState<AttributionSource[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`/api/admin/analytics?period=${period}`);
                if (!res.ok) throw new Error("Failed to fetch analytics");
                const json = await res.json();

                setData(json.analytics || []);
                setTotals(json.totals || { revenue: 0, users: 0, orders: 0 });
                setFunnelData(json.funnel || []);
                setAttributionData(json.attribution || []);
            } catch (err) {
                console.error(err);
                setError("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [period]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-500 mt-1">Platform performance overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {["7d", "30d", "90d"].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {["overview", "funnel", "attribution"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                                ? "border-purple-500 text-purple-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                    <ArrowUp className="w-4 h-4" /> 12.5%
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mt-4">{formatPrice(totals.revenue)}</p>
                            <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                    <ArrowUp className="w-4 h-4" /> 8.3%
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mt-4">{totals.users.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">Total Users</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                                    <ArrowDown className="w-4 h-4" /> 2.1%
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mt-4">{totals.orders.toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-1">Total Orders</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => { const d = new Date(str); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `${symbol}${(val / 1000).toFixed(0)}K`}
                                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            formatter={(val: any) => [formatPrice(val), "Revenue"]}
                                            labelFormatter={(label) => new Date(label).toDateString()}
                                            contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#revenueGrad)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* User Growth */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">User Growth</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => { const d = new Date(str); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            formatter={(val: any) => [val, "New Users"]}
                                            labelFormatter={(label) => new Date(label).toDateString()}
                                            contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                                        />
                                        <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: FUNNEL */}
            {activeTab === "funnel" && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
                            <p className="text-sm text-gray-500">Visitor to Order conversion steps</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Filter className="w-4 h-4" />
                            <span>Last 30 Days</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Visual Chart */}
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="stage"
                                        type="category"
                                        tick={{ fontSize: 14, fontWeight: 500 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={40}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Dropoff Metrics */}
                        <div className="space-y-6 flex flex-col justify-center">
                            {funnelData.map((step, index) => {
                                const nextStep = funnelData[index + 1];
                                const conversionRate = nextStep ? ((nextStep.count / step.count) * 100).toFixed(1) : null;

                                return (
                                    <div key={step.stage} className="relative">
                                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg z-10 relative">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 uppercase">{step.stage}</p>
                                                <p className="text-2xl font-bold">{step.count.toLocaleString()}</p>
                                            </div>
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: step.fill }}>
                                                {index + 1}
                                            </div>
                                        </div>

                                        {conversionRate && (
                                            <div className="ml-8 pl-4 border-l-2 border-gray-200 py-4 my-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                                        {conversionRate}% Conversion
                                                    </span>
                                                    <span className="text-xs text-red-500">
                                                        {(100 - parseFloat(conversionRate)).toFixed(1)}% Drop-off
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: ATTRIBUTION */}
            {activeTab === "attribution" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Source Distribution */}
                    <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Traffic Sources</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={attributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="source"
                                    >
                                        {attributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Source Performance Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Source Performance</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Source</th>
                                        <th className="px-6 py-3 font-medium text-right">Orders</th>
                                        <th className="px-6 py-3 font-medium text-right">Revenue</th>
                                        <th className="px-6 py-3 font-medium text-right">Avg. Order Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {attributionData.length > 0 ? (
                                        attributionData.map((item) => (
                                            <tr key={item.source} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium capitalize flex items-center gap-2">
                                                    {item.source === "google" && <span className="text-blue-500">Google</span>}
                                                    {item.source === "facebook" && <span className="text-blue-700">Facebook</span>}
                                                    {item.source === "instagram" && <span className="text-pink-600">Instagram</span>}
                                                    {item.source !== "google" && item.source !== "facebook" && item.source !== "instagram" && item.source}
                                                </td>
                                                <td className="px-6 py-4 text-right">{item.count}</td>
                                                <td className="px-6 py-4 text-right">{formatPrice(item.revenue)}</td>
                                                <td className="px-6 py-4 text-right text-gray-500">
                                                    {item.count ? formatPrice(item.revenue / item.count) : formatPrice(0)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No attribution data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
