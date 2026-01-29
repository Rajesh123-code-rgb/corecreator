"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { useCurrency } from "@/context/CurrencyContext";
import { useConfirmModal } from "@/components/molecules";
import {
    Tag,
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Copy,
    Pause,
    Play,
    ChevronLeft,
    ChevronRight,
    Percent,
    DollarSign,
    Calendar,
    Users,
    TrendingUp,
    X,
    Loader2
} from "lucide-react";

interface PromoCode {
    _id: string;
    code: string;
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    isActive: boolean;
    usedCount: number;
    usageLimit?: number;
    startDate: string;
    endDate: string;
    applicableTo: { type: string };
    status?: string; // Derived in frontend
}

export default function AdminPromoCodesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const [promoCodes, setPromoCodes] = React.useState<PromoCode[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedStatus, setSelectedStatus] = React.useState("all");
    const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; right: number } | null>(null);
    const confirmModal = useConfirmModal();

    // Create/Edit State
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [createLoading, setCreateLoading] = React.useState(false);
    const [editId, setEditId] = React.useState<string | null>(null);
    const [createForm, setCreateForm] = React.useState({
        code: "",
        name: "",
        discountType: "percentage",
        discountValue: 10,
        startDate: "",
        endDate: ""
    });

    const [stats, setStats] = React.useState({
        total: 0,
        active: 0,
        redeemed: 0,
        value: 0
    });

    const fetchPromoCodes = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search: searchQuery });
            if (selectedStatus !== "all") params.append("status", selectedStatus);

            const res = await fetch(`/api/admin/promo-codes?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const codes = data.promoCodes.map((c: any) => ({
                    ...c,
                    status: !c.isActive ? 'paused' : (new Date(c.endDate) < new Date() ? 'expired' : 'active'),
                    startDate: c.startDate ? c.startDate.split('T')[0] : '',
                    endDate: c.endDate ? c.endDate.split('T')[0] : '',
                    discountValue: c.discountValue || 0,
                    usedCount: c.usedCount || 0
                }));
                setPromoCodes(codes);

                // Calculate Stats
                const active = codes.filter((c: any) => c.status === "active").length;
                const redeemed = codes.reduce((acc: number, c: any) => acc + (c.usedCount || 0), 0);

                setStats({
                    total: codes.length,
                    active,
                    redeemed,
                    value: redeemed * 15 // Mock calculation for "Discounts Given" until order data is linked
                });
            }
        } catch (error) {
            console.error("Failed to fetch promo codes", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedStatus]);

    React.useEffect(() => {
        const timer = setTimeout(() => { fetchPromoCodes(); }, 300);
        return () => clearTimeout(timer);
    }, [fetchPromoCodes]);

    // Check for ?create=true
    React.useEffect(() => {
        if (searchParams.get("create") === "true") {
            setShowCreateModal(true);
            router.replace("/admin/promo-codes", { scroll: false });
        }
    }, [searchParams, router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const url = editId ? `/api/admin/promo-codes/${editId}` : "/api/admin/promo-codes";
            const method = editId ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setCreateForm({ code: "", name: "", discountType: "percentage", discountValue: 10, startDate: "", endDate: "" });
                setEditId(null);
                fetchPromoCodes();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to save promo code");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save promo code");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleEdit = (code: PromoCode) => {
        setCreateForm({
            code: code.code,
            name: code.name,
            discountType: code.discountType as any,
            discountValue: code.discountValue,
            startDate: code.startDate,
            endDate: code.endDate
        });
        setEditId(code._id);
        setShowCreateModal(true);
        setActiveDropdown(null);
    };

    const handleDuplicate = async (code: PromoCode) => {
        try {
            const res = await fetch("/api/admin/promo-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...code,
                    code: `${code.code}_COPY_${Math.floor(Math.random() * 1000)}`,
                    name: `Copy of ${code.name}`,
                    _id: undefined,
                    createdAt: undefined,
                    updatedAt: undefined,
                    usedCount: 0
                }),
            });
            if (res.ok) {
                fetchPromoCodes();
                setActiveDropdown(null);
            }
        } catch (error) {
            console.error("Duplicate error:", error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchPromoCodes();
                setActiveDropdown(null);
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleToggleStatus = async (code: PromoCode) => {
        try {
            const res = await fetch(`/api/admin/promo-codes/${code._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !code.isActive }),
            });
            if (res.ok) {
                fetchPromoCodes();
                setActiveDropdown(null);
            }
        } catch (error) {
            console.error("Status error:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: "bg-green-100 text-green-700",
            expired: "bg-gray-100 text-gray-700",
            paused: "bg-yellow-100 text-yellow-700"
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
                    <p className="text-gray-500 mt-1">Manage discount codes and promotions</p>
                </div>
                <Button onClick={() => {
                    setCreateForm({ code: "", name: "", discountType: "percentage", discountValue: 10, startDate: "", endDate: "" });
                    setEditId(null);
                    setShowCreateModal(true);
                }} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Promo Code
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Tag className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Codes</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                            <p className="text-sm text-gray-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.redeemed.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Times Used</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <DollarSign className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">~{formatPrice(stats.value)}</p>
                            <p className="text-sm text-gray-500">Discounts Given</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search codes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {["all", "active", "paused", "expired"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedStatus(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === s
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

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Period</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                        </div>
                                    </td>
                                </tr>
                            ) : promoCodes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                        No promo codes found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                promoCodes.map((code) => (
                                    <tr key={code._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-mono font-bold text-purple-600">{code.code}</p>
                                                <p className="text-sm text-gray-500">{code.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                {code.discountType === "percentage" ? (
                                                    <>
                                                        <Percent className="w-4 h-4 text-green-600" />
                                                        <span className="font-semibold">{code.discountValue}%</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        <span className="font-semibold">{formatPrice(code.discountValue)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(code.status || "active")}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="font-medium">{code.usedCount}</span>
                                            {code.usageLimit && <span className="text-gray-500"> / {code.usageLimit}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {code.startDate} - {code.endDate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setDropdownPosition({
                                                            top: rect.bottom + 5,
                                                            right: window.innerWidth - rect.right
                                                        });
                                                        setActiveDropdown(activeDropdown === code._id ? null : code._id);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Simplified) */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Showing {promoCodes.length} promo codes</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Fixed Position Dropdown */}
            {activeDropdown && dropdownPosition && (() => {
                const code = promoCodes.find(c => c._id === activeDropdown);
                if (!code) return null;
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
                                onClick={() => handleEdit(code)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                                onClick={() => confirmModal.confirm({
                                    title: "Duplicate Promo Code",
                                    message: `Duplicate "${code.code}"?`,
                                    confirmText: "Duplicate",
                                    variant: "info",
                                    onConfirm: () => handleDuplicate(code),
                                })}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" /> Duplicate
                            </button>
                            {code.isActive ? (
                                <button
                                    onClick={() => handleToggleStatus(code)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-yellow-600"
                                >
                                    <Pause className="w-4 h-4" /> Pause
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleToggleStatus(code)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                >
                                    <Play className="w-4 h-4" /> Activate
                                </button>
                            )}
                            <div className="my-1 border-t border-gray-50" />
                            <button
                                onClick={() => confirmModal.confirm({
                                    title: "Delete Promo Code",
                                    message: "Delete this promo code? This action cannot be undone.",
                                    confirmText: "Delete",
                                    onConfirm: () => handleDelete(code._id),
                                })}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </>
                );
            })()}

            {/* Create/Edit Promo Code Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{editId ? "Edit Promo Code" : "Create Promo Code"}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.code}
                                        onChange={(e) => setCreateForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                        placeholder="SUMMER20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Summer Sale"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        value={createForm.discountType}
                                        onChange={(e) => setCreateForm(f => ({ ...f, discountType: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                                    <input
                                        type="number"
                                        required
                                        value={createForm.discountValue}
                                        onChange={(e) => setCreateForm(f => ({ ...f, discountValue: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        min={1}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={createForm.startDate}
                                        onChange={(e) => setCreateForm(f => ({ ...f, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={createForm.endDate}
                                        onChange={(e) => setCreateForm(f => ({ ...f, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createLoading}>
                                    {createLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {editId ? "Save Changes" : "Create Code"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}

