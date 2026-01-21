"use client";

import * as React from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Package,
    Loader2,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    AlertTriangle,
    Plus,
} from "lucide-react";
import { Button } from "@/components/atoms";

interface ReturnRequest {
    _id: string;
    requestNumber: string;
    order: {
        orderNumber: string;
        createdAt: string;
    };
    item: {
        name: string;
        image?: string;
        price: number;
        quantity: number;
    };
    type: "return" | "refund";
    reason: string;
    status: "pending" | "under_review" | "approved" | "rejected" | "completed";
    refundAmount: number;
    createdAt: string;
}

export default function UserReturnsPage() {
    const [requests, setRequests] = React.useState<ReturnRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState("all");

    React.useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== "all") params.set("status", filter);

            const res = await fetch(`/api/user/returns?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
            }
        } catch (error) {
            console.error("Failed to fetch return requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { bg: string; text: string; icon: any }> = {
            pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
            under_review: { bg: "bg-blue-100", text: "text-blue-700", icon: Eye },
            approved: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
            rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
            completed: { bg: "bg-gray-100", text: "text-gray-700", icon: CheckCircle },
        };
        const config = configs[status] || configs.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="w-3 h-3" />
                {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
        );
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            damaged: "Damaged Product",
            wrong_item: "Wrong Item Received",
            not_as_described: "Not as Described",
            defective: "Defective Product",
            other: "Other",
        };
        return labels[reason] || reason;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/user/orders" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Returns & Refunds</h1>
                        <p className="text-gray-500 mt-1">Track your return and refund requests</p>
                    </div>
                </div>
                <Link href="/user/returns/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Request
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "under_review", label: "Under Review" },
                    { id: "approved", label: "Approved" },
                    { id: "rejected", label: "Rejected" },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.id
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl border border-gray-100">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No return requests found</p>
                        <Link href="/user/returns/new" className="text-purple-600 hover:underline text-sm mt-2 inline-block">
                            Submit a new request
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <div key={req._id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start gap-4">
                                    {req.item.image ? (
                                        <img
                                            src={req.item.image}
                                            alt={req.item.name}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-gray-900 truncate">{req.item.name}</p>
                                            {getStatusBadge(req.status)}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {req.requestNumber} • {req.type.charAt(0).toUpperCase() + req.type.slice(1)} Request
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Order: {req.order.orderNumber} • {getReasonLabel(req.reason)}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-gray-400">
                                                Submitted: {new Date(req.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="font-semibold text-gray-900">
                                                ₹{req.refundAmount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
