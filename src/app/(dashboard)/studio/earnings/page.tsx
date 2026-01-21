"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import {
    Download,
    DollarSign,
    TrendingUp,
    Calendar,
    Loader2,
    Percent,
    CreditCard,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface EarningsData {
    earnings: {
        totalGrossSales: number;
        totalOrders: number;
        thisMonthGross: number;
        thisMonthOrders: number;
        pendingAmount: number;
        platformCommission: number;
        processingFee: number;
        availableForPayout: number;
        totalPaidOut: number;
        payoutCount: number;
    };
    config: {
        platformCommissionRate: number;
        processingFeeRate: number;
        minimumPayout: number;
        currency: string;
    };
    transactions: {
        orderNumber: string;
        date: string;
        items: { name: string; price: number; quantity: number }[];
        grossAmount: number;
        payoutStatus: string;
    }[];
    payouts: {
        _id: string;
        netEarnings: number;
        status: string;
        paymentMethod: string;
        createdAt: string;
        processedAt?: string;
    }[];
}

export default function EarningsPage() {
    const { formatPrice } = useCurrency();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [data, setData] = React.useState<EarningsData | null>(null);
    const [activeTab, setActiveTab] = React.useState<"transactions" | "payouts">("transactions");

    const fetchEarnings = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/studio/earnings");
            if (!res.ok) {
                throw new Error("Failed to fetch earnings");
            }
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError("Failed to load earnings data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            included: "bg-blue-100 text-blue-800",
            paid: "bg-green-100 text-green-800",
            processing: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            failed: "bg-red-100 text-red-800"
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchEarnings}>Retry</Button>
            </div>
        );
    }

    const earnings = data?.earnings;
    const config = data?.config;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Earnings & Commissions</h1>
                    <p className="text-[var(--muted-foreground)]">Track your revenue, fees, and payouts</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchEarnings}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatPrice(earnings?.totalGrossSales || 0)}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Total Gross Sales</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatPrice(earnings?.thisMonthGross || 0)}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">This Month</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatPrice(earnings?.availableForPayout || 0)}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Available for Payout</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatPrice(earnings?.totalPaidOut || 0)}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Total Paid Out</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Commission Breakdown */}
            <Card>
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Percent className="w-5 h-5" />
                        Commission Breakdown
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-purple-600">{config?.platformCommissionRate}%</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Platform Commission</p>
                            <p className="text-lg font-medium mt-1">{formatPrice(earnings?.platformCommission || 0)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{config?.processingFeeRate}%</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Payment Processing</p>
                            <p className="text-lg font-medium mt-1">{formatPrice(earnings?.processingFee || 0)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">
                                {(100 - (config?.platformCommissionRate || 0) - (config?.processingFeeRate || 0)).toFixed(1)}%
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)]">Your Net Earnings</p>
                            <p className="text-lg font-medium mt-1">{formatPrice(earnings?.availableForPayout || 0)}</p>
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-[var(--muted-foreground)]">
                            <strong>Minimum Payout:</strong> {formatPrice(config?.minimumPayout || 10)} •
                            Payouts are processed weekly for eligible balances.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="border-b flex gap-4">
                <button
                    onClick={() => setActiveTab("transactions")}
                    className={`pb-3 px-1 border-b-2 font-medium ${activeTab === "transactions"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Recent Sales
                </button>
                <button
                    onClick={() => setActiveTab("payouts")}
                    className={`pb-3 px-1 border-b-2 font-medium ${activeTab === "payouts"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Payout History
                </button>
            </div>

            {/* Transactions Table */}
            {activeTab === "transactions" && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(!data?.transactions || data.transactions.length === 0) ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No transactions yet. Your sales will appear here.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.transactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{tx.orderNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {tx.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
                                            </td>
                                            <td className="px-6 py-4 font-medium">{formatPrice(tx.grossAmount)}</td>
                                            <td className="px-6 py-4">{getStatusBadge(tx.payoutStatus)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Payouts Table */}
            {activeTab === "payouts" && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(!data?.payouts || data.payouts.length === 0) ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No payouts yet. Payouts will appear here once processed.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.payouts.map((payout) => (
                                        <tr key={payout._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(payout.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-green-600">
                                                {formatPrice(payout.netEarnings)}
                                            </td>
                                            <td className="px-6 py-4 text-sm capitalize">
                                                {payout.paymentMethod.replace("_", " ")}
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(payout.status)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {payout.processedAt
                                                    ? new Date(payout.processedAt).toLocaleDateString()
                                                    : "-"
                                                }
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
