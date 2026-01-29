"use client";

import * as React from "react";
import {
    DollarSign,
    Users,
    Clock,
    CheckCircle,
    Search,
    RefreshCw,
    ExternalLink,
    AlertCircle,
    CreditCard
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface Studio {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    studioName?: string;
    totalSales: number;
    pendingPayout: number;
    totalPaidOut: number;
    orderCount: number;
    canPayout: boolean;
}

interface Payout {
    _id: string;
    seller: { name: string; email: string };
    sellerName: string;
    netEarnings: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    processedAt?: string;
}

interface PayoutSummary {
    pending: { count: number; total: number };
    processing: { count: number; total: number };
    completed: { count: number; total: number };
}

export default function PayoutsPage() {
    const { formatPrice } = useCurrency();
    const [studios, setStudios] = React.useState<Studio[]>([]);
    const [payouts, setPayouts] = React.useState<Payout[]>([]);
    const [summary, setSummary] = React.useState<PayoutSummary | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<"studios" | "history">("studios");
    const [searchTerm, setSearchTerm] = React.useState("");
    const [processingId, setProcessingId] = React.useState<string | null>(null);
    const [showPayoutModal, setShowPayoutModal] = React.useState(false);
    const [selectedStudio, setSelectedStudio] = React.useState<Studio | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [earningsRes, payoutsRes] = await Promise.all([
                fetch("/api/admin/studios/earnings"),
                fetch("/api/admin/payouts")
            ]);

            if (earningsRes.ok) {
                const data = await earningsRes.json();
                setStudios(data.studios || []);
            }

            if (payoutsRes.ok) {
                const data = await payoutsRes.json();
                setPayouts(data.payouts || []);
                setSummary(data.summary || null);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePayout = async (studioId: string, paymentMethod: string) => {
        setProcessingId(studioId);
        try {
            const res = await fetch("/api/admin/payouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sellerId: studioId, paymentMethod })
            });

            if (res.ok) {
                await fetchData();
                setShowPayoutModal(false);
                setSelectedStudio(null);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create payout");
            }
        } catch (error) {
            console.error("Failed to create payout:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleUpdatePayoutStatus = async (payoutId: string, status: string) => {
        setProcessingId(payoutId);
        try {
            const res = await fetch(`/api/admin/payouts/${payoutId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, transactionId: `TXN-${Date.now()}` })
            });

            if (res.ok) {
                await fetchData();
            }
        } catch (error) {
            console.error("Failed to update payout:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredStudios = studios.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );



    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
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
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Studio Payouts</h1>
                    <p className="text-gray-500">Manage creator earnings and process payments</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Payouts</p>
                            <p className="text-2xl font-bold">{formatPrice(summary?.pending.total || 0)}</p>
                            <p className="text-xs text-gray-400">{summary?.pending.count || 0} pending</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <RefreshCw className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Processing</p>
                            <p className="text-2xl font-bold">{formatPrice(summary?.processing.total || 0)}</p>
                            <p className="text-xs text-gray-400">{summary?.processing.count || 0} in progress</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Paid Out</p>
                            <p className="text-2xl font-bold">{formatPrice(summary?.completed.total || 0)}</p>
                            <p className="text-xs text-gray-400">{summary?.completed.count || 0} completed</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Studios</p>
                            <p className="text-2xl font-bold">{studios.length}</p>
                            <p className="text-xs text-gray-400">{studios.filter(s => s.canPayout).length} ready for payout</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-4">
                <button
                    onClick={() => setActiveTab("studios")}
                    className={`pb-3 px-1 border-b-2 font-medium ${activeTab === "studios"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Studio Earnings
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`pb-3 px-1 border-b-2 font-medium ${activeTab === "history"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Payout History
                </button>
            </div>

            {/* Content */}
            {activeTab === "studios" && (
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search studios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Studio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredStudios.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No studios found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudios.map((studio) => (
                                        <tr key={studio._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                        {studio.avatar ? (
                                                            <img src={studio.avatar} alt="" className="w-10 h-10 rounded-full" />
                                                        ) : (
                                                            <span className="text-purple-600 font-bold">
                                                                {studio.name.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{studio.name}</p>
                                                        <p className="text-sm text-gray-500">{studio.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium">{formatPrice(studio.totalSales)}</span>
                                                <span className="text-sm text-gray-500 ml-1">({studio.orderCount} orders)</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={studio.pendingPayout > 0 ? "text-yellow-600 font-medium" : "text-gray-400"}>
                                                    {formatPrice(studio.pendingPayout)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-green-600">{formatPrice(studio.totalPaidOut)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudio(studio);
                                                        setShowPayoutModal(true);
                                                    }}
                                                    disabled={!studio.canPayout || processingId === studio._id}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${studio.canPayout
                                                        ? "bg-purple-600 text-white hover:bg-purple-700"
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    {processingId === studio._id ? "Processing..." : "Payout"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "history" && (
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Studio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {payouts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No payout history
                                        </td>
                                    </tr>
                                ) : (
                                    payouts.map((payout) => (
                                        <tr key={payout._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(payout.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{payout.sellerName}</p>
                                                <p className="text-sm text-gray-500">{payout.seller?.email}</p>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {formatPrice(payout.netEarnings)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                                                {payout.paymentMethod.replace("_", " ")}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(payout.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {payout.status === "pending" && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdatePayoutStatus(payout._id, "processing")}
                                                            disabled={processingId === payout._id}
                                                            className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200"
                                                        >
                                                            Process
                                                        </button>
                                                    </div>
                                                )}
                                                {payout.status === "processing" && (
                                                    <button
                                                        onClick={() => handleUpdatePayoutStatus(payout._id, "completed")}
                                                        disabled={processingId === payout._id}
                                                        className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                                {payout.status === "completed" && (
                                                    <span className="text-xs text-gray-400">
                                                        {payout.processedAt && new Date(payout.processedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {showPayoutModal && selectedStudio && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <h2 className="text-xl font-bold mb-4">Create Payout</h2>
                        <div className="mb-4">
                            <p className="text-gray-600">Studio: <strong>{selectedStudio.name}</strong></p>
                            <p className="text-gray-600">Amount: <strong className="text-green-600">{formatPrice(selectedStudio.pendingPayout)}</strong></p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                            <select
                                id="paymentMethod"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                defaultValue="bank_transfer"
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="razorpay_payout">Razorpay Payout</option>
                                <option value="paypal">PayPal</option>
                                <option value="manual">Manual</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPayoutModal(false);
                                    setSelectedStudio(null);
                                }}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const method = (document.getElementById("paymentMethod") as HTMLSelectElement).value;
                                    handleCreatePayout(selectedStudio._id, method);
                                }}
                                disabled={processingId === selectedStudio._id}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {processingId === selectedStudio._id ? "Processing..." : "Confirm Payout"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
