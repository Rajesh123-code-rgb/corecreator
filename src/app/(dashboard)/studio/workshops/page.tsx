"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import { useConfirmModal, useToast } from "@/components/molecules";
import { Plus, Search, Calendar, Users, Clock, MoreVertical, Edit, Trash2, Loader2, ExternalLink, Eye } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface Workshop {
    id: string;
    title: string;
    slug?: string;
    date: string;
    duration: number;
    capacity: number;
    enrolled: number;
    price: number;
    currency?: "USD" | "INR" | "EUR" | "GBP";
    status: string;
    thumbnail: string;
    meetingUrl?: string;
}

export default function WorkshopsPage() {
    const router = useRouter();
    const [workshops, setWorkshops] = React.useState<Workshop[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("");
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const { formatPrice } = useCurrency();
    const confirmModal = useConfirmModal();
    const toast = useToast();

    const fetchWorkshops = React.useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (statusFilter) params.append("status", statusFilter);

            const res = await fetch(`/api/studio/workshops?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setWorkshops(data.workshops || []);
            }
        } catch (error) {
            console.error("Failed to fetch workshops:", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    React.useEffect(() => {
        const debounceTimer = setTimeout(fetchWorkshops, 300);
        return () => clearTimeout(debounceTimer);
    }, [fetchWorkshops]);

    const handleDelete = async (workshopId: string, title: string) => {
        setDeletingId(workshopId);
        try {
            const res = await fetch(`/api/studio/workshops/${workshopId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setWorkshops(prev => prev.filter(w => w.id !== workshopId));
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete workshop");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete workshop");
        } finally {
            setDeletingId(null);
        }
    };

    const handleStartWorkshop = (workshop: Workshop) => {
        if (workshop.meetingUrl) {
            let url = workshop.meetingUrl;
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = `https://${url}`;
            }
            window.open(url, "_blank");
        } else {
            router.push(`/studio/workshops/${workshop.id}/edit`);
            toast.error("Please add a meeting URL in the workshop settings first.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "upcoming": return "bg-blue-500 text-white";
            case "draft": return "bg-gray-400 text-white";
            case "completed": return "bg-green-500 text-white";
            case "cancelled": return "bg-red-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    if (loading && workshops.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Workshops</h1>
                    <p className="text-[var(--muted-foreground)]">Manage your live sessions and events</p>
                </div>
                <Button asChild>
                    <Link href="/studio/workshops/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Workshop
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <input
                        type="text"
                        placeholder="Search workshops..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)] text-sm"
                    />
                </div>
                <select
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--secondary-600)]" />
                    </div>
                ) : workshops.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Calendar className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">No workshops found</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mb-4">
                            {searchQuery || statusFilter
                                ? "Try adjusting your search or filters"
                                : "Schedule your first workshop to get started"}
                        </p>
                        {!searchQuery && !statusFilter && (
                            <Button asChild>
                                <Link href="/studio/workshops/new">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Schedule Workshop
                                </Link>
                            </Button>
                        )}
                    </Card>
                ) : (
                    workshops.map((workshop) => (
                        <Card key={workshop.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img
                                        src={workshop.thumbnail}
                                        alt={workshop.title}
                                        className="w-28 h-20 object-cover rounded-lg"
                                    />
                                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(workshop.status)}`}>
                                        {workshop.status}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{workshop.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-[var(--muted-foreground)]">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(workshop.date).toLocaleDateString()} at {new Date(workshop.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {workshop.duration} min
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {workshop.enrolled} / {workshop.capacity}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-lg">{formatPrice(workshop.price, workshop.currency || "INR")}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <Link
                                        href={`/studio/workshops/${workshop.id}/edit`}
                                        className="p-2 hover:bg-[var(--muted)] rounded-lg text-[var(--muted-foreground)]"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => confirmModal.confirm({
                                            title: "Delete Workshop",
                                            message: `Delete "${workshop.title}"? This action cannot be undone.`,
                                            confirmText: "Delete",
                                            onConfirm: () => handleDelete(workshop.id, workshop.title),
                                        })}
                                        disabled={deletingId === workshop.id}
                                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {deletingId === workshop.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                    {workshop.slug && (
                                        <Link
                                            href={`/workshops/${workshop.slug}`}
                                            target="_blank"
                                            className="p-2 hover:bg-[var(--muted)] rounded-lg text-[var(--muted-foreground)]"
                                            title="View Public Page"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--border)] flex gap-4">
                                <Link
                                    href={`/studio/workshops/${workshop.id}/edit`}
                                    className="text-sm font-medium hover:text-[var(--secondary-600)]"
                                >
                                    Edit Details
                                </Link>
                                {workshop.status === "upcoming" && (
                                    <button
                                        onClick={() => handleStartWorkshop(workshop)}
                                        className="text-sm font-medium hover:text-[var(--secondary-600)] ml-auto text-blue-600 flex items-center gap-1"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Start Workshop
                                    </button>
                                )}
                                {workshop.status === "draft" && (
                                    <Link
                                        href={`/studio/workshops/${workshop.id}/edit`}
                                        className="text-sm font-medium ml-auto text-amber-600 hover:text-amber-700"
                                    >
                                        Complete Setup →
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}

