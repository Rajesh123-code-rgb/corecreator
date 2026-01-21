"use client";

import * as React from "react";
import {
    Search,
    Loader2,
    Eye,
    MessageSquare,
    Package,
    AlertCircle,
    User,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    Send,
} from "lucide-react";
import { Button } from "@/components/atoms";

interface ReturnRequest {
    _id: string;
    requestNumber: string;
    order: {
        orderNumber: string;
        createdAt: string;
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
    };
    type: "return" | "refund";
    reason: string;
    description: string;
    status: "pending" | "under_review" | "approved" | "rejected" | "completed";
    evidence: {
        type: "image" | "video";
        url: string;
    }[];
    createdAt: string;
    studioFeedback?: {
        message: string;
        submittedAt: string;
        submittedBy: {
            name: string;
        };
    }[];
}

export default function StudioReturnsPage() {
    const [requests, setRequests] = React.useState<ReturnRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState("all");

    // Detail/Feedback Modal
    const [selectedRequest, setSelectedRequest] = React.useState<ReturnRequest | null>(null);
    const [feedback, setFeedback] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== "all") params.set("status", filter);

            const res = await fetch(`/api/studio/returns?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
            }
        } catch (error) {
            console.error("Failed to fetch returns:", error);
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async () => {
        if (!selectedRequest || !feedback.trim()) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/studio/returns/${selectedRequest._id}/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: feedback }),
            });

            if (res.ok) {
                // Refresh list
                fetchRequests();
                // Update local state to show new feedback immediately without closing modal
                const data = await res.json();
                setSelectedRequest(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        studioFeedback: [
                            ...(prev.studioFeedback || []),
                            {
                                message: feedback,
                                submittedAt: new Date().toISOString(),
                                submittedBy: { name: "You" } // Or get from session if available
                            }
                        ]
                    };
                });
                setFeedback("");
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        } finally {
            setSubmitting(false);
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Returns & Refunds</h1>
                    <p className="text-gray-500 mt-1">Manage return requests for your products</p>
                </div>
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

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-100">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No return requests found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <div key={req._id} className="p-4 hover:bg-gray-50">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {req.item.image ? (
                                        <img src={req.item.image} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{req.item.name}</h3>
                                                <p className="text-sm text-gray-500">Ref: {req.requestNumber}</p>
                                            </div>
                                            {getStatusBadge(req.status)}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>Customer: {req.user.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <AlertCircle className="w-4 h-4 text-gray-400" />
                                                <span className="capitalize">Reason: {req.reason.replace("_", " ")}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)}>
                                                View Details & Feedback <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <ArrowRight className="w-5 h-5 text-gray-500 rotate-45" /> {/* Close icon visual hack if X not imported, but X is not imported, let me fix imports or use text */}
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Request Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-900 mb-2">{selectedRequest.description}</p>

                                <div className="mt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Evidence</h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedRequest.evidence.map((file, i) => (
                                            <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden block">
                                                {file.type === "image" ? (
                                                    <img src={file.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">Video</div>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Existing Feedback */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Discussion
                                </h3>

                                {selectedRequest.studioFeedback && selectedRequest.studioFeedback.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedRequest.studioFeedback.map((fb, i) => (
                                            <div key={i} className="bg-purple-50 p-3 rounded-lg text-sm border border-purple-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-medium text-purple-900">{fb.submittedBy?.name || "Studio"}</span>
                                                    <span className="text-xs text-purple-700">{new Date(fb.submittedAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-gray-800">{fb.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No feedback provided yet.</p>
                                )}
                            </div>

                            {/* Add Feedback Form */}
                            <div className="border-t border-gray-100 pt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Add Feedback for Admin</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Provide context or approval for this return..."
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        disabled={submitting}
                                    />
                                    <Button onClick={submitFeedback} disabled={submitting || !feedback.trim()}>
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Your feedback helps the admin team make a decision.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
