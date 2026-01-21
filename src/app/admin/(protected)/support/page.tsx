"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    TicketIcon,
    Search,
    Loader2,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Send,
    User,
    AlertTriangle
} from "lucide-react";

interface Ticket {
    _id: string;
    ticketNumber: string;
    userId: { _id: string; name: string; email: string; avatar?: string };
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    assignedTo?: { _id: string; name: string };
    replies: { userId: string; message: string; isStaff: boolean; createdAt: string }[];
    createdAt: string;
}

export default function AdminSupportPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState({ open: 0, inProgress: 0, waitingCustomer: 0, resolved: 0, total: 0 });
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [replyText, setReplyText] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    const fetchTickets = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "20", status: statusFilter });
            const res = await fetch(`/api/admin/support?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
                setStats(data.stats || {});
                setTotalPages(data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    React.useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleUpdateTicket = async (ticketId: string, updates: Record<string, unknown>) => {
        try {
            const res = await fetch("/api/admin/support", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId, ...updates }),
            });
            if (res.ok) {
                fetchTickets();
                if (selectedTicket?._id === ticketId) {
                    const data = await res.json();
                    setSelectedTicket(prev => prev ? { ...prev, ...data.ticket } : null);
                }
            }
        } catch (error) {
            console.error("Failed to update ticket:", error);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setSubmitting(true);
        try {
            await handleUpdateTicket(selectedTicket._id, { reply: replyText, status: "waiting_customer" });
            setReplyText("");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            open: "bg-blue-100 text-blue-700",
            in_progress: "bg-yellow-100 text-yellow-700",
            waiting_customer: "bg-orange-100 text-orange-700",
            resolved: "bg-green-100 text-green-700",
            closed: "bg-gray-100 text-gray-700",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.open}`}>
                {status.replace("_", " ")}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            low: "bg-gray-100 text-gray-600",
            medium: "bg-blue-100 text-blue-600",
            high: "bg-orange-100 text-orange-600",
            urgent: "bg-red-100 text-red-600",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.medium}`}>
                {priority}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-500 mt-1">Manage customer support tickets</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg"><AlertCircle className="w-5 h-5 text-blue-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.open}</p>
                            <p className="text-xs text-gray-500">Open</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.inProgress}</p>
                            <p className="text-xs text-gray-500">In Progress</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.waitingCustomer}</p>
                            <p className="text-xs text-gray-500">Awaiting Reply</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                        <div>
                            <p className="text-xl font-bold">{stats.resolved}</p>
                            <p className="text-xs text-gray-500">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Tickets List */}
                <div className="flex-1 bg-white rounded-xl border border-gray-100">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex gap-2">
                            {["all", "open", "in_progress", "waiting_customer", "resolved"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s === "all" ? "All" : s.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" /></div>
                        ) : tickets.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No tickets found</div>
                        ) : (
                            tickets.map((ticket) => (
                                <button
                                    key={ticket._id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 ${selectedTicket?._id === ticket._id ? "bg-purple-50" : ""}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-purple-600">{ticket.ticketNumber}</span>
                                                {getStatusBadge(ticket.status)}
                                                {getPriorityBadge(ticket.priority)}
                                            </div>
                                            <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                                            <p className="text-sm text-gray-500 mt-1">{ticket.userId?.name} • {formatDate(ticket.createdAt)}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Ticket Detail */}
                {selectedTicket && (
                    <div className="w-96 bg-white rounded-xl border border-gray-100 flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-mono text-purple-600">{selectedTicket.ticketNumber}</span>
                                <select
                                    value={selectedTicket.status}
                                    onChange={(e) => handleUpdateTicket(selectedTicket._id, { status: e.target.value })}
                                    className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="waiting_customer">Waiting Customer</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <p className="font-semibold text-gray-900">{selectedTicket.subject}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">
                                    {selectedTicket.userId?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{selectedTicket.userId?.name}</p>
                                    <p className="text-xs text-gray-500">{selectedTicket.userId?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <div className="bg-gray-100 rounded-lg p-3">
                                <p className="text-sm">{selectedTicket.description}</p>
                                <p className="text-xs text-gray-400 mt-2">{formatDate(selectedTicket.createdAt)}</p>
                            </div>
                            {selectedTicket.replies?.map((reply, i) => (
                                <div key={i} className={`rounded-lg p-3 ${reply.isStaff ? "bg-purple-100" : "bg-gray-100"}`}>
                                    <p className={`text-xs mb-1 ${reply.isStaff ? "text-purple-600" : "text-gray-500"}`}>
                                        {reply.isStaff ? "Support Team" : "Customer"}
                                    </p>
                                    <p className="text-sm">{reply.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">{formatDate(reply.createdAt)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <div className="flex gap-2">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type reply..."
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                                    rows={2}
                                />
                                <Button onClick={handleReply} disabled={!replyText.trim() || submitting} className="self-end">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
