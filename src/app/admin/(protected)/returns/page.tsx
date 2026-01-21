"use client";

import * as React from "react";
import {
    Search,
    Loader2,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    MessageSquare,
    DollarSign,
    User,
    Store,
    Image as ImageIcon,
    Video,
    X,
} from "lucide-react";
import { Button } from "@/components/atoms";

interface ReturnRequest {
    _id: string;
    requestNumber: string;
    order: {
        orderNumber: string;
        createdAt: string;
        total: number;
        status: string;
    };
    user: {
        name: string;
        email: string;
        avatar?: string;
    };
    item: {
        name: string;
        price: number;
        quantity: number;
        image?: string;
        sellerId: {
            name: string;
            email: string;
        };
    };
    type: "return" | "refund";
    reason: string;
    description: string;
    status: "pending" | "under_review" | "approved" | "rejected" | "completed";
    evidence: {
        type: "image" | "video";
        url: string;
    }[];
    refundAmount: number;
    createdAt: string;
    studioFeedback?: {
        message: string;
        submittedAt: string;
        submittedBy: {
            name: string;
        };
    }[];
}

export default function AdminReturnsPage() {
    const [requests, setRequests] = React.useState<ReturnRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [filter, setFilter] = React.useState("all");
    const [search, setSearch] = React.useState("");

    // Review Modal State
    const [selectedRequest, setSelectedRequest] = React.useState<ReturnRequest | null>(null);
    const [reviewNote, setReviewNote] = React.useState("");
    const [refundAmount, setRefundAmount] = React.useState<number>(0);
    const [processing, setProcessing] = React.useState(false);

    React.useEffect(() => {
        fetchRequests();
    }, [page, filter, search]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                status: filter,
            });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/returns?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error("Failed to fetch returns:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (decision: "approved" | "rejected") => {
        if (!selectedRequest) return;
        setProcessing(true);

        try {
            const res = await fetch(`/api/admin/returns/${selectedRequest._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    decision,
                    notes: reviewNote,
                    refundAmount: decision === "approved" ? refundAmount : 0,
                }),
            });

            if (res.ok) {
                // Refresh list and close modal
                fetchRequests();
                setSelectedRequest(null);
                setReviewNote("");
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
        } finally {
            setProcessing(false);
        }
    };

    const openReviewModal = (req: ReturnRequest) => {
        setSelectedRequest(req);
        setRefundAmount(req.refundAmount);
        setReviewNote("");
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
                    <p className="text-gray-500 mt-1">Review and manage return requests</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search by Request ID or Item Name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
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
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No return requests found
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-purple-600">{req.requestNumber}</p>
                                        <p className="text-xs text-gray-500">{req.type.toUpperCase()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {req.user.avatar ? (
                                                <img src={req.user.avatar} className="w-6 h-6 rounded-full" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-gray-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{req.user.name}</p>
                                                <p className="text-xs text-gray-500">{req.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0">
                                                {req.item.image && <img src={req.item.image} className="w-full h-full object-cover rounded" />}
                                            </div>
                                            <p className="text-sm text-gray-900 truncate max-w-[150px]">{req.item.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        ₹{req.refundAmount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button size="sm" variant="ghost" onClick={() => openReviewModal(req)}>
                                            Review
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Review Request {selectedRequest.requestNumber}</h2>
                                <p className="text-sm text-gray-500">Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Details */}
                            <div className="space-y-6">
                                {/* Order & Item Info */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Store className="w-4 h-4" /> Item Details
                                    </h3>
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 p-1 flex-shrink-0">
                                            {selectedRequest.item.image ? (
                                                <img src={selectedRequest.item.image} className="w-full h-full object-cover rounded" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                                                    <Store className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedRequest.item.name}</p>
                                            <p className="text-sm text-gray-500">Qty: {selectedRequest.item.quantity} × ₹{selectedRequest.item.price}</p>
                                            <p className="text-sm text-purple-600 mt-1">Sold by: {selectedRequest.item.sellerId.name}</p>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Order: {selectedRequest.order.orderNumber} ({new Date(selectedRequest.order.createdAt).toLocaleDateString()})
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reason & Description */}
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</span>
                                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg mt-1 capitalize">
                                            {selectedRequest.reason.replace("_", " ")}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</span>
                                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg mt-1 text-sm whitespace-pre-wrap">
                                            {selectedRequest.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Evidence */}
                                <div>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evidence</span>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {selectedRequest.evidence.map((file, i) => (
                                            <a key={i} href={file.url} target="_blank" rel="noreferrer" className="block aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group">
                                                {file.type === "image" ? (
                                                    <img src={file.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Video className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Studio Feedback */}
                                {selectedRequest.studioFeedback && selectedRequest.studioFeedback.length > 0 && (
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                                            <MessageSquare className="w-4 h-4" /> Studio Feedback
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedRequest.studioFeedback.map((fb, i) => (
                                                <div key={i} className="bg-white/50 p-3 rounded-lg text-sm">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-amber-900">{fb.submittedBy.name}</span>
                                                        <span className="text-xs text-amber-700">{new Date(fb.submittedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-800">{fb.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Action */}
                            <div className="space-y-6">
                                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-purple-600" /> Review Decision
                                    </h3>

                                    {selectedRequest.status === "pending" || selectedRequest.status === "under_review" ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Refund Amount
                                                </label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        value={refundAmount}
                                                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg"
                                                        max={selectedRequest.item.price * selectedRequest.item.quantity}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Max valid amount: ₹{(selectedRequest.item.price * selectedRequest.item.quantity).toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Admin Notes
                                                </label>
                                                <textarea
                                                    value={reviewNote}
                                                    onChange={(e) => setReviewNote(e.target.value)}
                                                    rows={4}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none"
                                                    placeholder="Reason for approval/rejection..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                    onClick={() => handleReview("rejected")}
                                                    disabled={processing}
                                                >
                                                    Reject Request
                                                </Button>
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleReview("approved")}
                                                    disabled={processing}
                                                >
                                                    {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                    Approve & Refund
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${selectedRequest.status === "approved"
                                                ? "bg-green-100 text-green-600"
                                                : "bg-red-100 text-red-600"
                                                }`}>
                                                {selectedRequest.status === "approved" ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                            </div>
                                            <h4 className="font-bold text-gray-900 capitalize">{selectedRequest.status}</h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                This request has already been processed.
                                            </p>
                                            {selectedRequest.status === "approved" && (
                                                <p className="font-mono font-medium text-green-700 mt-2">
                                                    Refunded: ₹{selectedRequest.refundAmount.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
