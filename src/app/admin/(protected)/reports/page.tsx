"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    ShoppingCart,
    Download,
    Loader2,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface SalesReport {
    summary: {
        totalOrders: number;
        completedOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
    };
    dailySales: { _id: string; revenue: number; orders: number }[];
    topProducts: { _id: string; name: string; quantity: number; revenue: number }[];
}

interface UsersReport {
    summary: { totalUsers: number; byRole: { _id: string; count: number }[] };
    newUsersDaily: { _id: string; count: number }[];
}

interface ProductsReport {
    summary: {
        totalProducts: number;
        byCategory: { _id: string; count: number }[];
        byStatus: { _id: string; count: number }[];
    };
}

export default function AdminReportsPage() {
    const { formatPrice } = useCurrency();
    const [reportType, setReportType] = React.useState<"sales" | "users" | "products">("sales");
    const [loading, setLoading] = React.useState(false);
    const [dateRange, setDateRange] = React.useState({ start: "", end: "" });
    const [salesData, setSalesData] = React.useState<SalesReport | null>(null);
    const [usersData, setUsersData] = React.useState<UsersReport | null>(null);
    const [productsData, setProductsData] = React.useState<ProductsReport | null>(null);

    const fetchReport = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: reportType });
            if (dateRange.start) params.set("startDate", dateRange.start);
            if (dateRange.end) params.set("endDate", dateRange.end);

            const res = await fetch(`/api/admin/reports?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                if (reportType === "sales") setSalesData(data.data);
                if (reportType === "users") setUsersData(data.data);
                if (reportType === "products") setProductsData(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch report:", error);
        } finally {
            setLoading(false);
        }
    }, [reportType, dateRange]);

    React.useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleExportCSV = async () => {
        const params = new URLSearchParams({ type: reportType, format: "csv" });
        if (dateRange.start) params.set("startDate", dateRange.start);
        if (dateRange.end) params.set("endDate", dateRange.end);

        window.open(`/api/admin/reports?${params.toString()}`, "_blank");
    };



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500 mt-1">Analytics and data exports</p>
                </div>
                {reportType === "sales" && (
                    <Button onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                )}
            </div>

            {/* Report Type Tabs */}
            <div className="flex gap-2">
                {[
                    { type: "sales", label: "Sales", icon: ShoppingCart },
                    { type: "users", label: "Users", icon: Users },
                    { type: "products", label: "Products", icon: Package },
                ].map(({ type, label, icon: Icon }) => (
                    <button
                        key={type}
                        onClick={() => setReportType(type as typeof reportType)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${reportType === type
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {/* Date Range */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <span className="text-gray-400">to</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    {(dateRange.start || dateRange.end) && (
                        <Button variant="outline" size="sm" onClick={() => setDateRange({ start: "", end: "" })}>Clear</Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
            ) : (
                <>
                    {/* Sales Report */}
                    {reportType === "sales" && salesData && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Total Revenue</p>
                                            <p className="text-2xl font-bold mt-1">{formatPrice(salesData.summary.totalRevenue)}</p>
                                        </div>
                                        <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Total Orders</p>
                                            <p className="text-2xl font-bold mt-1">{salesData.summary.totalOrders}</p>
                                        </div>
                                        <div className="p-3 bg-blue-100 rounded-lg"><ShoppingCart className="w-6 h-6 text-blue-600" /></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Completed</p>
                                            <p className="text-2xl font-bold mt-1">{salesData.summary.completedOrders}</p>
                                        </div>
                                        <div className="p-3 bg-purple-100 rounded-lg"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Avg Order Value</p>
                                            <p className="text-2xl font-bold mt-1">{formatPrice(salesData.summary.averageOrderValue)}</p>
                                        </div>
                                        <div className="p-3 bg-orange-100 rounded-lg"><BarChart3 className="w-6 h-6 text-orange-600" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Daily Sales */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <h3 className="font-semibold mb-4">Daily Sales</h3>
                                    {salesData.dailySales.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No data for selected period</p>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {salesData.dailySales.slice(-14).map((day) => (
                                                <div key={day._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                                                    <span className="text-sm text-gray-600">{day._id}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm text-gray-500">{day.orders} orders</span>
                                                        <span className="font-medium">{formatPrice(day.revenue)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Top Products */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <h3 className="font-semibold mb-4">Top Products</h3>
                                    {salesData.topProducts.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No product data</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {salesData.topProducts.map((product, i) => (
                                                <div key={product._id} className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{product.name || "Unknown Product"}</p>
                                                        <p className="text-xs text-gray-500">{product.quantity} sold</p>
                                                    </div>
                                                    <span className="font-medium text-gray-900">{formatPrice(product.revenue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Report */}
                    {reportType === "users" && usersData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <p className="text-sm text-gray-500">Total Users</p>
                                    <p className="text-3xl font-bold mt-1">{usersData.summary.totalUsers}</p>
                                </div>
                                {usersData.summary.byRole.map((role) => (
                                    <div key={role._id} className="bg-white rounded-xl border border-gray-100 p-6">
                                        <p className="text-sm text-gray-500 capitalize">{role._id || "User"}</p>
                                        <p className="text-3xl font-bold mt-1">{role.count}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <h3 className="font-semibold mb-4">New Users (Last 14 Days)</h3>
                                <div className="space-y-2">
                                    {usersData.newUsersDaily.slice(-14).map((day) => (
                                        <div key={day._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                                            <span className="text-sm text-gray-600">{day._id}</span>
                                            <span className="font-medium">{day.count} new users</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Report */}
                    {reportType === "products" && productsData && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <p className="text-sm text-gray-500">Total Products</p>
                                <p className="text-3xl font-bold mt-1">{productsData.summary.totalProducts}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <h3 className="font-semibold mb-4">By Category</h3>
                                    <div className="space-y-2">
                                        {productsData.summary.byCategory.map((cat) => (
                                            <div key={cat._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                                                <span className="text-sm text-gray-600 capitalize">{cat._id || "Uncategorized"}</span>
                                                <span className="font-medium">{cat.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 p-6">
                                    <h3 className="font-semibold mb-4">By Status</h3>
                                    <div className="space-y-2">
                                        {productsData.summary.byStatus.map((status) => (
                                            <div key={status._id} className="flex items-center justify-between py-2 border-b border-gray-50">
                                                <span className="text-sm text-gray-600 capitalize">{status._id}</span>
                                                <span className="font-medium">{status.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
