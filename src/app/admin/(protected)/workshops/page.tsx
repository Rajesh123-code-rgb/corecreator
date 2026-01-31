"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Search,
    Calendar,
    Loader2,
    MoreHorizontal,
    Users,
    Clock,
    CheckCircle,
    DollarSign,
    Eye,
    X,
    ShieldOff,
    ShieldCheck,
    TrendingUp,
    MapPin,
    Video,
    Globe
} from "lucide-react";
import { Button } from "@/components/atoms";
import { useConfirmModal, useToast } from "@/components/molecules";
import { useCurrency } from "@/context/CurrencyContext";

interface Workshop {
    _id: string;
    title: string;
    description?: string;
    slug: string;
    thumbnail?: string;
    instructorName: string;
    instructorAvatar?: string;
    instructor?: { _id: string; name: string; email: string; studioProfile?: { name?: string } };
    date: string;
    duration?: number;
    workshopType?: "online" | "offline";
    location?: { country?: string; city?: string; address?: string };
    meetingUrl?: string;
    price: number;
    currency?: string;
    capacity: number;
    enrolledCount: number;
    category?: string;
    tags?: string[];
    level?: "beginner" | "intermediate" | "advanced" | "all";
    requirements?: string[];
    agenda?: string[];
    status: "draft" | "pending" | "upcoming" | "rejected" | "completed" | "cancelled" | "blocked";
    rejectionReason?: string;
    createdAt?: string;
    updatedAt?: string;
    submittedAt?: string;
    reviewedAt?: string;
}

export default function AdminWorkshopsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [workshops, setWorkshops] = React.useState<Workshop[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [stats, setStats] = React.useState({ total: 0, upcoming: 0, completed: 0, enrolled: 0 });
    const [showCreateModal, setShowCreateModal] = React.useState(false);

    // New States
    const [viewWorkshop, setViewWorkshop] = React.useState<Workshop | null>(null);
    const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; right: number } | null>(null);
    const confirmModal = useConfirmModal();
    const { formatPrice } = useCurrency();
    const toast = useToast();

    // Rejection Modal State
    const [showRejectionModal, setShowRejectionModal] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [workshopToReject, setWorkshopToReject] = React.useState<Workshop | null>(null);

    // Check for ?create=true query parameter
    React.useEffect(() => {
        if (searchParams.get("create") === "true") {
            setShowCreateModal(true);
            router.replace("/admin/workshops", { scroll: false });
        }
    }, [searchParams, router]);

    const fetchWorkshops = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                search,
            });
            if (statusFilter !== "all") params.set("status", statusFilter);

            const res = await fetch(`/api/admin/workshops?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setWorkshops(data.workshops || []);
                setTotalPages(data.pagination?.pages || 1);

                const upcoming = (data.workshops || []).filter((w: Workshop) => w.status === "upcoming").length;
                const completed = (data.workshops || []).filter((w: Workshop) => w.status === "completed").length;
                const enrolled = (data.workshops || []).reduce((sum: number, w: Workshop) => sum + (w.enrolledCount || 0), 0);
                setStats({ total: data.pagination?.total || 0, upcoming, completed, enrolled });
            }
        } catch (error) {
            console.error("Failed to fetch workshops:", error);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    React.useEffect(() => {
        const timer = setTimeout(() => { fetchWorkshops(); }, 300);
        return () => clearTimeout(timer);
    }, [fetchWorkshops]);

    const handleAction = async (id: string, action: "delete" | "approve" | "reject" | "block" | "unblock", reason?: string) => {
        setActionLoading(id);
        try {
            if (action === "delete") {
                const res = await fetch(`/api/admin/workshops/${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Delete failed");
            } else if (action === "approve" || action === "unblock") {
                const res = await fetch(`/api/admin/workshops/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "upcoming", rejectionReason: null, reviewedAt: new Date() }),
                });
                if (!res.ok) throw new Error("Approve failed");
            } else if (action === "reject") {
                const res = await fetch(`/api/admin/workshops/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "rejected", rejectionReason: reason, reviewedAt: new Date() }),
                });
                if (!res.ok) throw new Error("Reject failed");
            } else if (action === "block") {
                const res = await fetch(`/api/admin/workshops/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "blocked", reviewedAt: new Date() }),
                });
                if (!res.ok) throw new Error("Block failed");
            }
            fetchWorkshops();
            setActiveDropdown(null);
        } catch (error) {
            console.error("Action error:", error);
            toast.error("An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    const submitRejection = () => {
        if (!workshopToReject || !rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        handleAction(workshopToReject._id, "reject", rejectionReason);
        setShowRejectionModal(false);
        setRejectionReason("");
        setWorkshopToReject(null);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            upcoming: "bg-blue-100 text-blue-700",
            completed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
            blocked: "bg-red-100 text-red-700",
            draft: "bg-gray-100 text-gray-700",
            pending: "bg-yellow-100 text-yellow-700",
            rejected: "bg-red-100 text-red-700"
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workshop Management</h1>
                    <p className="text-gray-500 mt-1">Manage upcoming and past workshops</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Workshops</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                            <p className="text-sm text-gray-500">Upcoming</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                            <p className="text-sm text-gray-500">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.enrolled}</p>
                            <p className="text-sm text-gray-500">Total Enrolled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search workshops..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {["all", "pending", "upcoming", "blocked", "completed", "cancelled"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workshop</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator (ID)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : workshops.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No workshops found
                                    </td>
                                </tr>
                            ) : (
                                workshops.map((workshop) => (
                                    <tr key={workshop._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{workshop.title}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-900">{workshop.instructor?.name || workshop.instructorName}</p>
                                                <p className="text-xs text-gray-400 font-mono">{workshop.instructor?._id?.slice(-8) || "—"}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(workshop.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{formatPrice(workshop.price)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[80px] overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-600 rounded-full"
                                                        style={{ width: `${Math.min(100, (workshop.enrolledCount / workshop.capacity) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600">{workshop.enrolledCount}/{workshop.capacity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(workshop.status)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                <button
                                                    onClick={() => setViewWorkshop(workshop)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(activeDropdown === workshop._id ? null : workshop._id);
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPosition({
                                                                top: rect.bottom + 5,
                                                                right: window.innerWidth - rect.right
                                                            });
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${activeDropdown === workshop._id ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dropdown Overlay & Menu */}
            {activeDropdown && dropdownPosition && (() => {
                const workshop = workshops.find(w => w._id === activeDropdown);
                if (!workshop) return null;
                return (
                    <>
                        <div
                            className="fixed inset-0 z-[9998] cursor-default"
                            onClick={() => {
                                setActiveDropdown(null);
                                setDropdownPosition(null);
                            }}
                        />
                        <div
                            className="fixed bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] border border-gray-100 py-1 z-[9999] animate-in fade-in zoom-in-95 duration-200"
                            style={{
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                                width: '12rem',
                                transformOrigin: 'top right'
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => {
                                    setViewWorkshop(workshop);
                                    setActiveDropdown(null);
                                }}
                            >
                                <Eye className="w-4 h-4" /> View Details
                            </button>

                            {(workshop.status === "pending" || workshop.status === "upcoming") && (
                                <button
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                    onClick={() => {
                                        window.open(`/workshops/${workshop.slug}?preview=admin`, '_blank');
                                        setActiveDropdown(null);
                                    }}
                                >
                                    <TrendingUp className="w-4 h-4" /> View Live
                                </button>
                            )}

                            {workshop.status === "pending" && (
                                <>
                                    <div className="my-1 border-t border-gray-50" />
                                    <button
                                        className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                        onClick={() => {
                                            handleAction(workshop._id, "approve");
                                        }}
                                        disabled={actionLoading === workshop._id}
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                        onClick={() => {
                                            setWorkshopToReject(workshop);
                                            setShowRejectionModal(true);
                                            setActiveDropdown(null);
                                        }}
                                    >
                                        <X className="w-4 h-4" /> Reject
                                    </button>
                                </>
                            )}

                            <div className="my-1 border-t border-gray-50" />

                            {/* Block/Activate for upcoming workshops */}
                            {workshop.status === "upcoming" && (
                                <button
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    onClick={() => confirmModal.confirm({
                                        title: "Block Workshop",
                                        message: `Block "${workshop.title}"? This will hide it from the platform.`,
                                        confirmText: "Block",
                                        onConfirm: () => handleAction(workshop._id, "block"),
                                    })}
                                    disabled={actionLoading === workshop._id}
                                >
                                    {actionLoading === workshop._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                                    Block Workshop
                                </button>
                            )}

                            {workshop.status === "blocked" && (
                                <button
                                    className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    onClick={() => confirmModal.confirm({
                                        title: "Activate Workshop",
                                        message: `Activate "${workshop.title}"? This will make it visible on the platform again.`,
                                        confirmText: "Activate",
                                        variant: "info",
                                        onConfirm: () => handleAction(workshop._id, "unblock"),
                                    })}
                                    disabled={actionLoading === workshop._id}
                                >
                                    {actionLoading === workshop._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Activate Workshop
                                </button>
                            )}
                        </div>
                    </>
                );
            })()}

            {/* Rejection Modal */}
            {showRejectionModal && workshopToReject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Reject Workshop</h2>
                            <p className="text-sm text-gray-500 mt-1">Rejecting: {workshopToReject.title}</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                            <textarea
                                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={4}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explain why this workshop is being rejected..."
                            />
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => { setShowRejectionModal(false); setRejectionReason(""); setWorkshopToReject(null); }}>
                                Cancel
                            </Button>
                            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={submitRejection}>
                                Reject Workshop
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Workshop Modal */}
            {viewWorkshop && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold">Workshop Details</h2>
                                <p className="text-sm text-gray-500">ID: {viewWorkshop._id}</p>
                            </div>
                            <button onClick={() => setViewWorkshop(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Top Section: Thumbnail & Basic Info */}
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Thumbnail */}
                                <div className="w-full lg:w-2/5 space-y-3">
                                    <div className="aspect-video bg-purple-50 rounded-xl overflow-hidden flex items-center justify-center">
                                        {viewWorkshop.thumbnail ? (
                                            <img src={viewWorkshop.thumbnail} alt={viewWorkshop.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <Calendar className="w-16 h-16 text-purple-300" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {viewWorkshop.workshopType === "online" ? (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                                <Video className="w-3 h-3" /> Online
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> Offline
                                            </span>
                                        )}
                                        {viewWorkshop.level && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">{viewWorkshop.level}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusBadge(viewWorkshop.status)}
                                            {viewWorkshop.category && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{viewWorkshop.category}</span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">{viewWorkshop.title}</h3>
                                    </div>

                                    {/* Pricing */}
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-bold text-purple-600">
                                            {formatPrice(viewWorkshop.price)}
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    {viewWorkshop.tags && viewWorkshop.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {viewWorkshop.tags.map((tag, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Date & Time</p>
                                            <p className="text-sm font-bold text-gray-900">{new Date(viewWorkshop.date).toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Duration</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {viewWorkshop.duration ? `${Math.floor(viewWorkshop.duration / 60)}h ${viewWorkshop.duration % 60}m` : "—"}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Capacity</p>
                                            <p className="text-lg font-bold text-gray-900">{viewWorkshop.capacity}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500">Enrolled</p>
                                            <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                                                {viewWorkshop.enrolledCount}
                                                <span className="text-xs text-gray-400">/ {viewWorkshop.capacity}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location/Meeting Details */}
                            {viewWorkshop.workshopType === "offline" && viewWorkshop.location && (
                                <div className="bg-orange-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Location
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-orange-700 text-xs">Country</p>
                                            <p className="font-medium text-gray-900">{viewWorkshop.location.country || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-orange-700 text-xs">City</p>
                                            <p className="font-medium text-gray-900">{viewWorkshop.location.city || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-orange-700 text-xs">Address</p>
                                            <p className="font-medium text-gray-900">{viewWorkshop.location.address || "—"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {viewWorkshop.workshopType === "online" && viewWorkshop.meetingUrl && (
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <Video className="w-4 h-4" /> Meeting Details
                                    </h4>
                                    <p className="text-sm text-blue-700">Meeting link is configured for this workshop</p>
                                </div>
                            )}

                            {/* Studio/Instructor Details */}
                            <div className="bg-purple-50 rounded-xl p-4">
                                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                    Studio / Instructor Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-purple-700">Studio Name</p>
                                        <p className="font-medium text-gray-900">{viewWorkshop.instructor?.studioProfile?.name || viewWorkshop.instructorName || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-700">Instructor Name</p>
                                        <p className="font-medium text-gray-900">{viewWorkshop.instructor?.name || viewWorkshop.instructorName || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-700">Email</p>
                                        <p className="font-medium text-gray-900">{viewWorkshop.instructor?.email || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-700">Instructor ID</p>
                                        <p className="font-medium text-gray-900 font-mono text-sm">{viewWorkshop.instructor?._id || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                                <div className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                                    {viewWorkshop.description || "No description provided."}
                                </div>
                            </div>

                            {/* Requirements & Agenda */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {viewWorkshop.requirements && viewWorkshop.requirements.length > 0 && (
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-amber-900 mb-3">Requirements</h4>
                                        <ul className="space-y-1 text-sm">
                                            {viewWorkshop.requirements.map((req, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-amber-600">•</span>
                                                    <span>{req}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {viewWorkshop.agenda && viewWorkshop.agenda.length > 0 && (
                                    <div className="bg-green-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-green-900 mb-3">Agenda</h4>
                                        <ul className="space-y-1 text-sm">
                                            {viewWorkshop.agenda.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                                {viewWorkshop.createdAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Created</p>
                                        <p className="font-medium">{new Date(viewWorkshop.createdAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {viewWorkshop.updatedAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Updated</p>
                                        <p className="font-medium">{new Date(viewWorkshop.updatedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {viewWorkshop.submittedAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Submitted</p>
                                        <p className="font-medium">{new Date(viewWorkshop.submittedAt).toLocaleString()}</p>
                                    </div>
                                )}
                                {viewWorkshop.reviewedAt && (
                                    <div>
                                        <p className="text-gray-500 text-xs">Reviewed</p>
                                        <p className="font-medium">{new Date(viewWorkshop.reviewedAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            {/* Rejection Reason */}
                            {viewWorkshop.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <h4 className="font-semibold text-red-800 mb-1">Rejection Reason</h4>
                                    <p className="text-red-700 text-sm">{viewWorkshop.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                            <Button variant="outline" onClick={() => setViewWorkshop(null)}>Close</Button>
                            {(viewWorkshop.status === "pending" || viewWorkshop.status === "upcoming") && (
                                <Button onClick={() => window.open(`/workshops/${viewWorkshop.slug}?preview=admin`, '_blank')}>View Live</Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Workshop Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Create New Workshop</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <h3 className="font-medium text-gray-900 mb-1">Workshop Creation</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Workshops are created by Studios from their dashboard.
                                </p>
                                <p className="text-xs text-gray-400">
                                    As admin, you can manage and moderate existing workshops.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
