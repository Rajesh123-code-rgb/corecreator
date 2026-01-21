"use client";

import * as React from "react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";
import {
    Headphones,
    Plus,
    Loader2,
    Send,
    Clock,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    ChevronRight,
    X,
} from "lucide-react";

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    replies: { message: string; isStaff: boolean; createdAt: string }[];
}

const CATEGORIES = [
    { value: "order", label: "Order Issues" },
    { value: "payment", label: "Payment & Billing" },
    { value: "refund", label: "Refunds" },
    { value: "product", label: "Product/Course/Workshop" },
    { value: "account", label: "Account Settings" },
    { value: "technical", label: "Technical Support" },
    { value: "other", label: "Other" },
];

const PRIORITIES = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

export default function StudioSupportPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [stats, setStats] = React.useState({ open: 0, inProgress: 0, resolved: 0, total: 0 });

    const [formData, setFormData] = React.useState({
        subject: "",
        description: "",
        category: "other",
        priority: "medium",
    });

    const fetchTickets = React.useCallback(async () => {
        try {
            const res = await fetch("/api/support/tickets");
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
                setStats(data.stats || { open: 0, inProgress: 0, resolved: 0, total: 0 });
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

    const handleCreateTicket = async () => {
        if (!formData.subject.trim() || !formData.description.trim()) {
            alert("Please fill in subject and description");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setFormData({ subject: "", description: "", category: "other", priority: "medium" });
                fetchTickets();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to create ticket");
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
            alert("An error occurred");
        } finally {
            setIsSubmitting(false);
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
        const labels: Record<string, string> = {
            open: "Open",
            in_progress: "In Progress",
            waiting_customer: "Awaiting Response",
            resolved: "Resolved",
            closed: "Closed",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {labels[status] || status}
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
            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${styles[priority] || "bg-gray-100"}`}>
                {priority}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Support Center</h1>
                    <p className="text-[var(--muted-foreground)]">Get help with your studio account</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.open}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Open</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.inProgress}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">In Progress</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.resolved}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Resolved</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">Total Tickets</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tickets List */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-[var(--border)]">
                    <h2 className="font-semibold">Your Tickets</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--secondary-600)]" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12">
                        <Headphones className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="font-medium text-gray-900 mb-1">No tickets yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Create a ticket to get help from our support team</p>
                        <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Ticket
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                className="p-4 hover:bg-[var(--muted)] cursor-pointer flex items-center gap-4"
                                onClick={() => setSelectedTicket(ticket)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-[var(--muted-foreground)]">{ticket.ticketNumber}</span>
                                        {getStatusBadge(ticket.status)}
                                        {getPriorityBadge(ticket.priority)}
                                    </div>
                                    <h3 className="font-medium truncate">{ticket.subject}</h3>
                                    <p className="text-sm text-[var(--muted-foreground)] truncate">{ticket.description}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs text-[var(--muted-foreground)]">{formatDate(ticket.createdAt)}</p>
                                    {ticket.replies.length > 0 && (
                                        <p className="text-xs text-[var(--secondary-600)]">{ticket.replies.length} replies</p>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Create Support Ticket</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <Input
                                label="Subject"
                                placeholder="Brief summary of your issue"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full min-h-[120px] p-3 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    placeholder="Describe your issue in detail..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Priority</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        {PRIORITIES.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button onClick={handleCreateTicket} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Submit Ticket
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Ticket Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm text-[var(--muted-foreground)]">{selectedTicket.ticketNumber}</span>
                                    {getStatusBadge(selectedTicket.status)}
                                </div>
                                <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Original Description */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                                <p className="text-xs text-gray-400 mt-2">{formatDate(selectedTicket.createdAt)}</p>
                            </div>

                            {/* Replies */}
                            {selectedTicket.replies.map((reply, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg ${reply.isStaff ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-medium ${reply.isStaff ? "text-blue-600" : "text-gray-600"}`}>
                                            {reply.isStaff ? "Support Team" : "You"}
                                        </span>
                                        <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                                </div>
                            ))}

                            {selectedTicket.status === "resolved" || selectedTicket.status === "closed" ? (
                                <div className="p-4 bg-green-50 rounded-lg text-center">
                                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm text-green-700 font-medium">This ticket has been {selectedTicket.status}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                                    Our support team will respond shortly.
                                </p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
