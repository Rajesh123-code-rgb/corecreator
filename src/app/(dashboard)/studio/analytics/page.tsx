"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import {
    BarChart3,
    Users,
    TrendingUp,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    MoreVertical,
    Mail,
    Search,
    Loader2,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface AnalyticsData {
    stats: {
        totalRevenue: number;
        totalStudents: number;
        avgRating: number;
        activeCourses: number;
    };
    revenueData: Array<{ month: string; amount: number }>;
    students: Array<{ id: string; name: string; course: string; progress: number; lastActive: string; avatar: string }>;
    coursePerformance: Array<{ title: string; views: number; sales: number; revenue: number; rating: number }>;
}

export default function AnalyticsPage() {
    const { formatPrice } = useCurrency();
    const [activeTab, setActiveTab] = React.useState<"overview" | "students" | "courses">("overview");
    const [data, setData] = React.useState<AnalyticsData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [dateRange, setDateRange] = React.useState("30days");

    React.useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/studio/analytics?range=${dateRange}`);
                if (res.ok) {
                    const jsonData = await res.json();
                    setData(jsonData);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [dateRange]);

    if (loading && !data) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
            </div>
        );
    }

    // Simple SVG Line Chart Component
    const SimpleLineChart = ({ data: chartData }: { data: Array<{ month: string; amount: number }> }) => {
        const max = Math.max(...chartData.map((d: { amount: number }) => d.amount));
        const points = chartData.map((d: { amount: number }, i: number) => {
            const x = (i / (chartData.length - 1)) * 100;
            const y = 100 - (d.amount / max) * 100;
            return `${x},${y}`;
        }).join(" ");

        return (
            <div className="w-full h-64 relative pt-6 pb-8">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />

                    {/* Line Path */}
                    <polyline
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Area under the line */}
                    <polygon
                        fill="url(#gradient)"
                        points={`0,100 ${points} 100,100`}
                        opacity="0.2"
                    />

                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Data Points */}
                    {chartData.map((d: { amount: number; month: string }, i: number) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = 100 - (d.amount / max) * 100;
                        return (
                            <g key={i} className="group">
                                <circle cx={x} cy={y} r="1.5" fill="#8b5cf6" stroke="white" strokeWidth="0.5" />
                                {/* Tooltip on hover (simple CSS based) */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <rect x={x - 10} y={y - 15} width="20" height="10" rx="2" fill="black" />
                                    <text x={x} y={y - 8} textAnchor="middle" fill="white" fontSize="4">{d.amount}</text>
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between mt-2 text-xs text-[var(--muted-foreground)]">
                    {chartData.map((d: { month: string }) => <span key={d.month}>{d.month}</span>)}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Analytics</h1>
                    <p className="text-[var(--muted-foreground)]">Track your performance and earnings</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="30days">Last 30 Days</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="year">Last Year</option>
                        <option value="alltime">All Time</option>
                    </select>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center`}>
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{formatPrice(data?.stats.totalRevenue || 0)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Total Revenue</p>
                </Card>

                <Card className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center`}>
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> +24%
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{data?.stats.totalStudents?.toLocaleString() || 0}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Total Students</p>
                </Card>

                <Card className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center`}>
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <ArrowDownRight className="w-3 h-3 mr-1" /> -2%
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{data?.stats.avgRating || 0}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Average Rating</p>
                </Card>

                <Card className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className={`w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center`}>
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> +5%
                        </span>
                    </div>
                    <p className="text-2xl font-bold">{data?.stats.activeCourses || 0}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Active Courses</p>
                </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--border)] mb-6">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview"
                            ? "border-[var(--primary-600)] text-[var(--primary-600)]"
                            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("students")}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "students"
                            ? "border-[var(--primary-600)] text-[var(--primary-600)]"
                            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                    >
                        Students
                    </button>
                    <button
                        onClick={() => setActiveTab("courses")}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "courses"
                            ? "border-[var(--primary-600)] text-[var(--primary-600)]"
                            : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            }`}
                    >
                        Course Performance
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="grid gap-6">
                {activeTab === "overview" && (
                    <>
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-lg">Revenue Growth</h2>
                                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                    <span className="w-3 h-3 rounded-full bg-violet-500"></span> Earnings
                                </div>
                            </div>
                            <SimpleLineChart data={data?.revenueData || []} />
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <h2 className="font-bold text-lg mb-4">Recent Enrolments</h2>
                                <div className="space-y-4">
                                    {(data?.students || []).slice(0, 3).map((student: any) => (
                                        <div key={student.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-600 text-sm">
                                                    {student.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{student.name}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">{student.course}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-[var(--muted-foreground)]">{student.lastActive}</span>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="link" className="w-full mt-4 text-[var(--secondary-600)]">View All Students</Button>
                            </Card>

                            <Card className="p-6">
                                <h2 className="font-bold text-lg mb-4">Top Performing Courses</h2>
                                <div className="space-y-4">
                                    {(data?.coursePerformance || []).slice(0, 3).map((course: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 text-center font-bold text-[var(--muted-foreground)]">#{i + 1}</span>
                                                <div>
                                                    <p className="font-medium text-sm line-clamp-1">{course.title}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)]">{course.sales} sales</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-sm text-green-600">{formatPrice(course.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="link" className="w-full mt-4 text-[var(--secondary-600)]">View All Courses</Button>
                            </Card>
                        </div>
                    </>
                )}

                {activeTab === "students" && (
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                <input className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none" placeholder="Search students..." />
                            </div>
                            <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--muted)]/50 text-xs font-semibold text-[var(--muted-foreground)] text-left">
                                    <tr>
                                        <th className="px-6 py-3">Student</th>
                                        <th className="px-6 py-3">Course</th>
                                        <th className="px-6 py-3">Progress</th>
                                        <th className="px-6 py-3">Last Active</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {(data?.students || []).map((student: any) => (
                                        <tr key={student.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                        {student.avatar}
                                                    </div>
                                                    <span className="font-medium text-sm">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{student.course}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[var(--secondary-500)] rounded-full" style={{ width: `${student.progress}%` }} />
                                                    </div>
                                                    <span className="text-xs font-medium">{student.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{student.lastActive}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-[var(--secondary-600)] hover:underline text-sm font-medium inline-flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> Message
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === "courses" && (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--muted)]/50 text-xs font-semibold text-[var(--muted-foreground)] text-left">
                                    <tr>
                                        <th className="px-6 py-3">Course Name</th>
                                        <th className="px-6 py-3 text-right">Views</th>
                                        <th className="px-6 py-3 text-right">Sales</th>
                                        <th className="px-6 py-3 text-right">Conversion Rate</th>
                                        <th className="px-6 py-3 text-right">Rating</th>
                                        <th className="px-6 py-3 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {(data?.coursePerformance || []).map((course: any, i: number) => (
                                        <tr key={i} className="hover:bg-[var(--muted)]/20 transition-colors text-sm">
                                            <td className="px-6 py-4 font-medium">{course.title}</td>
                                            <td className="px-6 py-4 text-right">{course.views.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">{course.sales.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">{((course.sales / course.views) * 100).toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                                    {course.rating} <Users className="w-3 h-3" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">{formatPrice(course.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
