"use client";

import * as React from "react";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card } from "@/components/molecules";
import { Loader2, DollarSign, RefreshCcw, Percent, CreditCard } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/molecules/Table";

interface RevenueCategory {
    category: string;
    revenue: number;
    count: number;
}

interface FinanceData {
    revenueByCategory: RevenueCategory[];
    refunds: {
        amount: number;
        count: number;
    };
    recentTransactions: any[];
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

export default function AdminFinancePage() {
    const [data, setData] = React.useState<FinanceData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchFinance = async () => {
            try {
                const res = await fetch("/api/admin/finance/reports");
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFinance();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!data) return <div>Failed to load data</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Gross Revenue</p>
                        <h2 className="text-3xl font-bold mt-2">
                            ₹{data.revenueByCategory.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
                        </h2>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                </Card>

                <Card className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Platform Commission</p>
                        <h2 className="text-3xl font-bold mt-2 text-green-600">
                            ₹{Math.round(data.revenueByCategory.reduce((acc, curr) => acc + curr.revenue, 0) * 0.12).toLocaleString()}
                        </h2>
                        <span className="text-xs text-gray-500">12% of gross</span>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                        <Percent className="w-6 h-6 text-green-600" />
                    </div>
                </Card>

                <Card className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Processing Fees</p>
                        <h2 className="text-3xl font-bold mt-2 text-blue-600">
                            ₹{Math.round(data.revenueByCategory.reduce((acc, curr) => acc + curr.revenue, 0) * 0.029).toLocaleString()}
                        </h2>
                        <span className="text-xs text-gray-500">2.9% gateway</span>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Refunds</p>
                        <h2 className="text-3xl font-bold mt-2 text-red-600">
                            -₹{data.refunds.amount.toLocaleString()}
                        </h2>
                        <span className="text-xs text-gray-500">{data.refunds.count} transactions</span>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                        <RefreshCcw className="w-6 h-6 text-red-600" />
                    </div>
                </Card>
            </div>

            {/* Commission Summary */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Commission & Fee Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-3xl font-bold text-purple-600">12%</p>
                        <p className="text-sm text-gray-500 mt-1">Platform Commission Rate</p>
                        <p className="text-lg font-medium mt-2">
                            ₹{Math.round(data.revenueByCategory.reduce((acc, curr) => acc + curr.revenue, 0) * 0.12).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">2.9%</p>
                        <p className="text-sm text-gray-500 mt-1">Payment Processing Fee</p>
                        <p className="text-lg font-medium mt-2">
                            ₹{Math.round(data.revenueByCategory.reduce((acc, curr) => acc + curr.revenue, 0) * 0.029).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">14.9%</p>
                        <p className="text-sm text-gray-500 mt-1">Total Platform Earnings</p>
                        <p className="text-lg font-medium mt-2">
                            ₹{Math.round(data.revenueByCategory.reduce((acc, curr) => acc + curr.revenue, 0) * 0.149).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                        <strong>💡 Tip:</strong> Configure commission rates in{" "}
                        <a href="/admin/settings" className="underline font-medium">Settings → Payments</a>
                    </p>
                </div>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Revenue Split Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-6">Revenue Source</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.revenueByCategory.map(item => ({ name: item.category, value: item.revenue }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.revenueByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Recent Transactions List */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.recentTransactions.map((tx) => (
                                    <TableRow key={tx.orderNumber}>
                                        <TableCell className="font-medium text-sm">{tx.orderNumber}</TableCell>
                                        <TableCell className="text-sm text-gray-500">{tx.user?.name || "Unknown"}</TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            +${tx.total}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
