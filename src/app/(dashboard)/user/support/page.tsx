"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    TicketIcon,
    Plus,
    Search,
    Loader2,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Send,
    Paperclip,
    ArrowLeft
} from "lucide-react";

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    replies: { userId: { _id: string; name: string }; message: string; isStaff: boolean; createdAt: string }[];
    createdAt: string;
}

export default function UserTicketsPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState({ open: 0, inProgress: 0, resolved: 0 });
    const [showNewForm, setShowNewForm] = React.useState(false);
    const [newTicket, setNewTicket] = React.useState({ subject: "", description: "", category: "other" });
    const [submitting, setSubmitting] = React.useState(false);
    const [replyText, setReplyText] = React.useState("");

    const fetchTickets = React.useCallback(async () => {
        try {
            const res = await fetch("/api/support/tickets");
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
                setStats(data.stats || { open: 0, inProgress: 0, resolved: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const fetchTicketDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/support/tickets/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedTicket(data.ticket);
            }
        } catch (error) {
            console.error("Failed to fetch ticket:", error);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTicket),
            });
            if (res.ok) {
                setShowNewForm(false);
                setNewTicket({ subject: "", description: "", category: "other" });
                fetchTickets();
            }
        } catch (error) {
            console.error("Failed to create ticket:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/support/tickets/${selectedTicket._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: replyText }),
            });
            if (res.ok) {
                setReplyText("");
                fetchTicketDetails(selectedTicket._id);
            }
        } catch (error) {
            console.error("Failed to reply:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
            open: { bg: "bg-blue-100", text: "text-blue-700", icon: AlertCircle },
            in_progress: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
            waiting_customer: { bg: "bg-orange-100", text: "text-orange-700", icon: Clock },
            resolved: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
            closed: { bg: "bg-gray-100", text: "text-gray-700", icon: CheckCircle },
        };
        const style = styles[status] || styles.open;
        const Icon = style.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                <Icon className="w-3 h-3" />
                {status.replace("_", " ")}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    // Ticket Details View
    if (selectedTicket) {
        return (
            <div className="space-y-6">
                <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4" /> Back to tickets
                </button>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-purple-600 font-mono">{selectedTicket.ticketNumber}</p>
                            <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedTicket.subject}</h2>
                        </div>
                        {getStatusBadge(selectedTicket.status)}
                    </div>
                    <p className="text-gray-600">{selectedTicket.description}</p>
                    <div className="flex gap-4 mt-4 text-sm text-gray-500">
                        <span>Category: <span className="text-gray-700 capitalize">{selectedTicket.category}</span></span>
                        <span>Created: {formatDate(selectedTicket.createdAt)}</span>
                    </div>
                </div>

                {/* Replies */}
                <div className="bg-white rounded-xl border border-gray-100">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold">Conversation</h3>
                    </div>
                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                        {selectedTicket.replies.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No replies yet. Our team will respond soon.</p>
                        ) : (
                            selectedTicket.replies.map((reply, index) => (
                                <div key={index} className={`flex ${reply.isStaff ? "justify-start" : "justify-end"}`}>
                                    <div className={`max-w-[80%] ${reply.isStaff ? "bg-gray-100" : "bg-purple-600 text-white"} rounded-xl px-4 py-3`}>
                                        <p className={`text-xs mb-1 ${reply.isStaff ? "text-gray-500" : "text-purple-200"}`}>
                                            {reply.isStaff ? "Support Team" : "You"} • {formatDate(reply.createdAt)}
                                        </p>
                                        <p className="text-sm">{reply.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {selectedTicket.status !== "closed" && (
                        <div className="p-4 border-t border-gray-100">
                            <div className="flex gap-2">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    rows={2}
                                />
                                <Button onClick={handleReply} disabled={!replyText.trim() || submitting}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                    <p className="text-gray-500 mt-1">Get help from our support team</p>
                </div>
                <Button onClick={() => setShowNewForm(true)}>
                    <Plus className="w-4 h-4 mr-2" /> New Ticket
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                    <p className="text-sm text-gray-500">Open</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                    <p className="text-sm text-gray-500">In Progress</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    <p className="text-sm text-gray-500">Resolved</p>
                </div>
            </div>

            {/* New Ticket Form */}
            {showNewForm && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-semibold mb-4">Create New Ticket</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                                    placeholder="Brief description of your issue"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    value={newTicket.category}
                                    onChange={(e) => setNewTicket(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                >
                                    <option value="order">Order Issue</option>
                                    <option value="payment">Payment</option>
                                    <option value="refund">Refund Request</option>
                                    <option value="product">Product Question</option>
                                    <option value="account">Account</option>
                                    <option value="technical">Technical Issue</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={newTicket.description}
                                onChange={(e) => setNewTicket(p => ({ ...p, description: e.target.value }))}
                                placeholder="Describe your issue in detail..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                rows={4}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
                            <Button onClick={handleCreateTicket} disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Submit Ticket
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tickets List */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold">Your Tickets</h3>
                </div>
                {tickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <TicketIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No tickets yet</p>
                        <p className="text-sm text-gray-400 mt-1">Create a ticket to get help from our team</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {tickets.map((ticket) => (
                            <button
                                key={ticket._id}
                                onClick={() => fetchTicketDetails(ticket._id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-purple-600">{ticket.ticketNumber}</span>
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                    <p className="font-medium text-gray-900">{ticket.subject}</p>
                                    <p className="text-sm text-gray-500 mt-1">{formatDate(ticket.createdAt)}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
