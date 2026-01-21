"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    Loader2,
    CheckCircle,
    XCircle,
    FileText,
    ExternalLink,
    AlertCircle,
    Clock,
    Search,
    Filter,
    User,
    Shield,
    Download,
} from "lucide-react";

interface KYCUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    kyc: {
        status: "pending" | "approved" | "rejected";
        submittedAt: string;
        verifiedAt?: string;
        rejectionReason?: string;
        documents: {
            type: string;
            url: string;
            verified: boolean;
        }[];
    };
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function KycVerificationPage() {
    const [users, setUsers] = React.useState<KYCUser[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [processing, setProcessing] = React.useState<string | null>(null);
    const [selectedUser, setSelectedUser] = React.useState<KYCUser | null>(null);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("pending");
    const [searchQuery, setSearchQuery] = React.useState("");

    const fetchUsers = React.useCallback(async (status: StatusFilter) => {
        setLoading(true);
        try {
            const url = status === "all"
                ? "/api/admin/users/verification?status=all"
                : `/api/admin/users/verification?status=${status}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchUsers(statusFilter);
    }, [statusFilter, fetchUsers]);

    const handleAction = async (action: "approve" | "reject") => {
        if (!selectedUser) return;
        if (action === "reject" && !rejectionReason) {
            alert("Please provide a rejection reason");
            return;
        }

        setProcessing(selectedUser._id);
        try {
            const res = await fetch("/api/admin/users/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: selectedUser._id,
                    action,
                    reason: rejectionReason
                }),
            });

            if (res.ok) {
                // Update user status in state instead of removing
                setUsers(prev => prev.map(u => {
                    if (u._id === selectedUser._id) {
                        return {
                            ...u,
                            kyc: {
                                ...u.kyc,
                                status: action === "approve" ? "approved" : "rejected",
                                verifiedAt: action === "approve" ? new Date().toISOString() : undefined,
                                rejectionReason: action === "reject" ? rejectionReason : undefined
                            }
                        };
                    }
                    return u;
                }));
                setSelectedUser(null);
                setRejectionReason("");
                // Refresh the list for current filter
                fetchUsers(statusFilter);
            }
        } catch (error) {
            alert("Action failed");
        } finally {
            setProcessing(null);
        }
    };

    // Filter users by search query
    const filteredUsers = React.useMemo(() => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    // Stats
    const stats = {
        pending: users.filter(u => u.kyc.status === "pending").length,
        approved: users.filter(u => u.kyc.status === "approved").length,
        rejected: users.filter(u => u.kyc.status === "rejected").length,
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-700",
            approved: "bg-green-100 text-green-700",
            rejected: "bg-red-100 text-red-700",
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100"}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
                    <p className="text-gray-500 mt-1">Review studio identity verifications</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-medium">
                        <Clock className="w-4 h-4" />
                        {stats.pending} Pending
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {stats.approved} Approved
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200">
                {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((status) => (
                    <button
                        key={status}
                        onClick={() => {
                            setStatusFilter(status);
                            setSelectedUser(null);
                        }}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${statusFilter === status
                                ? "border-purple-600 text-purple-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {status === "pending" && <Clock className="w-4 h-4 inline mr-1.5" />}
                        {status === "approved" && <CheckCircle className="w-4 h-4 inline mr-1.5" />}
                        {status === "rejected" && <XCircle className="w-4 h-4 inline mr-1.5" />}
                        {status === "all" && <Filter className="w-4 h-4 inline mr-1.5" />}
                        {status === "all" ? "All Applications" : status}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User List */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search applicants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <button
                                    key={user._id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedUser?._id === user._id ? "bg-purple-50 hover:bg-purple-50" : ""
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-900 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            {user.name}
                                        </span>
                                        {getStatusBadge(user.kyc.status)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 truncate mr-2">{user.email}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(user.kyc.submittedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No {statusFilter === "all" ? "" : statusFilter} applications found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verification Detail */}
                <div className="lg:col-span-2">
                    {selectedUser ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                                        {getStatusBadge(selectedUser.kyc.status)}
                                    </div>
                                    <p className="text-gray-500">{selectedUser.email}</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Submitted: {new Date(selectedUser.kyc.submittedAt).toLocaleString()}
                                    </p>
                                </div>
                                {selectedUser.kyc.status === "pending" && (
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleAction("reject")}
                                            disabled={!!processing}
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={() => handleAction("approve")}
                                            disabled={!!processing || rejectionReason.length > 0}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {processing === selectedUser._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Approve
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Show rejection reason if rejected */}
                            {selectedUser.kyc.status === "rejected" && selectedUser.kyc.rejectionReason && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Rejection Reason
                                    </div>
                                    <p className="text-red-600 text-sm">{selectedUser.kyc.rejectionReason}</p>
                                </div>
                            )}

                            {/* Show verified date if approved */}
                            {selectedUser.kyc.status === "approved" && selectedUser.kyc.verifiedAt && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700 font-medium">
                                        <CheckCircle className="w-4 h-4" />
                                        Verified on {new Date(selectedUser.kyc.verifiedAt).toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {/* Documents */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Submitted Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedUser.kyc.documents.map((doc, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-medium capitalize flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                    {doc.type.replace(/_/g, " ")}
                                                </span>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                    <a
                                                        href={doc.url}
                                                        download
                                                        className="text-gray-500 hover:text-gray-700 text-sm"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                                                {doc.url ? (
                                                    doc.url.toLowerCase().match(/\.(pdf)$/) ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                                            <FileText className="w-12 h-12 text-gray-400 mb-2" />
                                                            <a
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-purple-600 hover:underline text-sm"
                                                            >
                                                                View PDF Document
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={doc.url}
                                                            alt={doc.type}
                                                            className="w-full h-full object-contain bg-white"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const parent = e.currentTarget.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = `
                                                                        <div class="w-full h-full flex flex-col items-center justify-center">
                                                                            <svg class="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                                            </svg>
                                                                            <a href="${doc.url}" target="_blank" class="text-purple-600 hover:underline text-sm">Open Document</a>
                                                                        </div>
                                                                    `;
                                                                }
                                                            }}
                                                        />
                                                    )
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        No document available
                                                    </div>
                                                )}
                                            </div>
                                            {doc.verified && (
                                                <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verified
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Review Notes (only for pending) */}
                            {selectedUser.kyc.status === "pending" && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">Review Notes</h3>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Add notes or rejection reason (required for rejection)..."
                                        className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                                    />
                                    {rejectionReason && (
                                        <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Text entered - this will be used as the rejection reason.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400">
                            <Shield className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Select an applicant to review</p>
                            <p className="text-sm">Choose from the list on the left</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
