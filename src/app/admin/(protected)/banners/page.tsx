"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { useConfirmModal } from "@/components/molecules";
import {
    Image as ImageIcon,
    Plus,
    Loader2,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Link as LinkIcon,
    MousePointer
} from "lucide-react";

interface Banner {
    _id: string;
    title: string;
    subtitle?: string;
    image: string;
    link?: string;
    buttonText?: string;
    placement: string;
    startDate?: string;
    endDate?: string;
    order: number;
    isActive: boolean;
    clicks: number;
    impressions: number;
}

const PLACEMENTS = [
    { value: "home_hero", label: "Home Hero" },
    { value: "home_secondary", label: "Home Secondary" },
    { value: "category", label: "Category Page" },
    { value: "product", label: "Product Page" },
    { value: "checkout", label: "Checkout" },
];

export default function AdminBannersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [banners, setBanners] = React.useState<Banner[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        title: "", subtitle: "", image: "", link: "", buttonText: "",
        placement: "home_hero", startDate: "", endDate: "", order: 0
    });
    const [submitting, setSubmitting] = React.useState(false);
    const [placementFilter, setPlacementFilter] = React.useState("all");
    const confirmModal = useConfirmModal();

    // Check for ?create=true query parameter
    React.useEffect(() => {
        if (searchParams.get("create") === "true") {
            setShowForm(true);
            setEditingId(null);
            setFormData({ title: "", subtitle: "", image: "", link: "", buttonText: "", placement: "home_hero", startDate: "", endDate: "", order: 0 });
            router.replace("/admin/banners", { scroll: false });
        }
    }, [searchParams, router]);

    const fetchBanners = React.useCallback(async () => {
        try {
            const params = placementFilter !== "all" ? `?placement=${placementFilter}` : "";
            const res = await fetch(`/api/admin/banners${params}`);
            if (res.ok) {
                const data = await res.json();
                setBanners(data.banners || []);
            }
        } catch (error) {
            console.error("Failed to fetch banners:", error);
        } finally {
            setLoading(false);
        }
    }, [placementFilter]);

    React.useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.image.trim()) return;
        setSubmitting(true);
        try {
            const url = "/api/admin/banners";
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { id: editingId, ...formData } : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ title: "", subtitle: "", image: "", link: "", buttonText: "", placement: "home_hero", startDate: "", endDate: "", order: 0 });
                fetchBanners();
            }
        } catch (error) {
            console.error("Failed to save banner:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (banner: Banner) => {
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || "",
            image: banner.image,
            link: banner.link || "",
            buttonText: banner.buttonText || "",
            placement: banner.placement,
            startDate: banner.startDate ? new Date(banner.startDate).toISOString().split("T")[0] : "",
            endDate: banner.endDate ? new Date(banner.endDate).toISOString().split("T")[0] : "",
            order: banner.order,
        });
        setEditingId(banner._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
            fetchBanners();
        } catch (error) {
            console.error("Failed to delete banner:", error);
        }
    };

    const handleToggleActive = async (banner: Banner) => {
        try {
            await fetch("/api/admin/banners", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: banner._id, isActive: !banner.isActive }),
            });
            fetchBanners();
        } catch (error) {
            console.error("Failed to toggle banner:", error);
        }
    };

    const getPlacementLabel = (value: string) => PLACEMENTS.find(p => p.value === value)?.label || value;

    const isScheduledNow = (banner: Banner) => {
        const now = new Date();
        if (banner.startDate && new Date(banner.startDate) > now) return false;
        if (banner.endDate && new Date(banner.endDate) < now) return false;
        return true;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
                    <p className="text-gray-500 mt-1">Manage promotional banners across the site</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: "", subtitle: "", image: "", link: "", buttonText: "", placement: "home_hero", startDate: "", endDate: "", order: 0 }); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Banner
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-semibold mb-4">{editingId ? "Edit Banner" : "Add Banner"}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Banner title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Subtitle</label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData(p => ({ ...p, subtitle: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Optional subtitle"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData(p => ({ ...p, image: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Link URL</label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData(p => ({ ...p, link: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="/products or https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Button Text</label>
                            <input
                                type="text"
                                value={formData.buttonText}
                                onChange={(e) => setFormData(p => ({ ...p, buttonText: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Shop Now"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Placement</label>
                            <select
                                value={formData.placement}
                                onChange={(e) => setFormData(p => ({ ...p, placement: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            >
                                {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Order</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData(p => ({ ...p, order: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                min={0}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                        <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting || !formData.title.trim() || !formData.image.trim()}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setPlacementFilter("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${placementFilter === "all" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                    All
                </button>
                {PLACEMENTS.map(p => (
                    <button
                        key={p.value}
                        onClick={() => setPlacementFilter(p.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${placementFilter === p.value ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Banners Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
            ) : banners.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No banners yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banners.map((banner) => (
                        <div key={banner._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="relative h-40">
                                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <p className="font-bold text-lg">{banner.title}</p>
                                    {banner.subtitle && <p className="text-sm opacity-80">{banner.subtitle}</p>}
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button onClick={() => handleToggleActive(banner)} className={`px-2 py-1 rounded text-xs font-medium ${banner.isActive && isScheduledNow(banner) ? "bg-green-500" : "bg-gray-500"} text-white`}>
                                        {banner.isActive && isScheduledNow(banner) ? "Live" : "Inactive"}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">{getPlacementLabel(banner.placement)}</span>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{banner.impressions}</span>
                                        <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" />{banner.clicks}</span>
                                    </div>
                                </div>
                                {(banner.startDate || banner.endDate) && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                        <Calendar className="w-3 h-3" />
                                        {banner.startDate && new Date(banner.startDate).toLocaleDateString()}
                                        {banner.startDate && banner.endDate && " - "}
                                        {banner.endDate && new Date(banner.endDate).toLocaleDateString()}
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleEdit(banner)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => confirmModal.confirm({
                                        title: "Delete Banner",
                                        message: `Delete the banner "${banner.title}"? This action cannot be undone.`,
                                        confirmText: "Delete",
                                        onConfirm: () => handleDelete(banner._id),
                                    })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
