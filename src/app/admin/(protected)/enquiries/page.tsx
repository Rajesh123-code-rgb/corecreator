"use client";

import * as React from "react";
import { format } from "date-fns";
import {
    Search,
    Filter,
    MoreVertical,
    CheckCircle,
    Trash2,
    Mail,
    Phone,
    Clock,
    MessageSquare,
    Loader2
} from "lucide-react";
import { Button } from "@/components/atoms";
import { useConfirmModal } from "@/components/molecules/ConfirmModal";

interface Enquiry {
    _id: string;
    name: string;
    email: string;
    phone: string;
    message?: string;
    type: string;
    source?: string;
    status: "new" | "read" | "contacted" | "archived";
    createdAt: string;
}

export default function AdminEnquiriesPage() {
    const [enquiries, setEnquiries] = React.useState<Enquiry[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState("all");
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);

    const { confirm, ConfirmModalElement } = useConfirmModal();

    React.useEffect(() => {
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        try {
            const res = await fetch("/api/admin/enquiries");
            if (res.ok) {
                const data = await res.json();
                setEnquiries(data.enquiries);
            }
        } catch (error) {
            console.error("Failed to fetch enquiries", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setActionLoading(id);
        try {
            const res = await fetch("/api/admin/enquiries", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                setEnquiries(prev => prev.map(e => e._id === id ? { ...e, status: newStatus as any } : e));
            }
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        confirm({
            title: "Delete Enquiry",
            message: "Are you sure you want to delete this enquiry? This action cannot be undone.",
            confirmText: "Delete",
            variant: "danger",
            onConfirm: async () => {
                setActionLoading(id);
                try {
                    const res = await fetch(`/api/admin/enquiries?id=${id}`, {
                        method: "DELETE",
                    });
                    if (res.ok) {
                        setEnquiries(prev => prev.filter(e => e._id !== id));
                    }
                } catch (error) {
                    console.error("Delete failed", error);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const filteredEnquiries = enquiries.filter(e => {
        if (filter === "all") return true;
        if (filter === "new") return e.status === "new" || e.status === "read"; // 'New' usually implies pending action
        return e.status === filter;
    });

    if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" /></div>;

    return (
        <div className="space-y-6">
            {ConfirmModalElement}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Enquiries & Leads</h1>
                    <p className="text-gray-500 mt-1">Manage incoming interest, contact requests, and newsletter signups.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="new">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredEnquiries.map((enquiry) => (
                    <div
                        key={enquiry._id}
                        className={`bg-white rounded-xl border p-5 flex flex-col md:flex-row gap-6 transition-all hover:shadow-md ${enquiry.status === "new" ? "border-purple-200 shadow-sm" : "border-gray-100"}`}
                    >
                        <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900">{enquiry.name}</h3>
                                        {enquiry.status === "contacted" && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Contacted</span>}
                                        {enquiry.status === "new" && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">New</span>}
                                        <span className="text-xs text-gray-400 capitalize px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">{enquiry.type}</span>
                                        {enquiry.source && <span className="text-xs text-blue-500 capitalize px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100">via {enquiry.source}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <a href={`mailto:${enquiry.email}`} className="flex items-center hover:text-purple-600 transition-colors">
                                            <Mail className="w-4 h-4 mr-1.5" />
                                            {enquiry.email}
                                        </a>
                                        <a href={`tel:${enquiry.phone}`} className="flex items-center hover:text-purple-600 transition-colors">
                                            <Phone className="w-4 h-4 mr-1.5" />
                                            {enquiry.phone}
                                        </a>
                                        <span className="flex items-center text-gray-400">
                                            <Clock className="w-4 h-4 mr-1.5" />
                                            {format(new Date(enquiry.createdAt), "MMM d, yyyy h:mm a")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {enquiry.message && (
                                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100 mt-2">
                                    {enquiry.message}
                                </div>
                            )}
                        </div>

                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 min-w-[140px] pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                            {enquiry.status !== "contacted" && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full justify-center bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                    onClick={() => handleUpdateStatus(enquiry._id, "contacted")}
                                    disabled={actionLoading === enquiry._id}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Contacted
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-center text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(enquiry._id)}
                                disabled={actionLoading === enquiry._id}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}

                {filteredEnquiries.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No Enquiries Found</h3>
                        <p className="text-gray-500">No enquiries match the selected filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
