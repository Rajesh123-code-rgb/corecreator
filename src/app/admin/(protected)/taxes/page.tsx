"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { useConfirmModal } from "@/components/molecules";
import {
    Receipt,
    Plus,
    Loader2,
    Edit,
    Trash2,
    Globe,
    Percent,
    Check
} from "lucide-react";

interface TaxRate {
    _id: string;
    name: string;
    rate: number;
    country: string;
    state?: string;
    applyTo: string;
    displayName?: string;
    isInclusive: boolean;
    isActive: boolean;
}

export default function AdminTaxesPage() {
    const [taxes, setTaxes] = React.useState<TaxRate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        name: "",
        rate: 0,
        country: "IN",
        state: "",
        applyTo: "all",
        displayName: "",
        isInclusive: false,
    });
    const [submitting, setSubmitting] = React.useState(false);
    const confirmModal = useConfirmModal();

    const fetchTaxes = React.useCallback(async () => {
        try {
            const res = await fetch("/api/admin/taxes");
            if (res.ok) {
                const data = await res.json();
                setTaxes(data.taxes || []);
            }
        } catch (error) {
            console.error("Failed to fetch taxes:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTaxes();
    }, [fetchTaxes]);

    const handleSubmit = async () => {
        if (!formData.name.trim() || formData.rate < 0) return;
        setSubmitting(true);
        try {
            const url = "/api/admin/taxes";
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
                setFormData({ name: "", rate: 0, country: "IN", state: "", applyTo: "all", displayName: "", isInclusive: false });
                fetchTaxes();
            }
        } catch (error) {
            console.error("Failed to save tax:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (tax: TaxRate) => {
        setFormData({
            name: tax.name,
            rate: tax.rate,
            country: tax.country,
            state: tax.state || "",
            applyTo: tax.applyTo,
            displayName: tax.displayName || "",
            isInclusive: tax.isInclusive,
        });
        setEditingId(tax._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/admin/taxes?id=${id}`, { method: "DELETE" });
            fetchTaxes();
        } catch (error) {
            console.error("Failed to delete tax:", error);
        }
    };

    const handleToggleActive = async (tax: TaxRate) => {
        try {
            await fetch("/api/admin/taxes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: tax._id, isActive: !tax.isActive }),
            });
            fetchTaxes();
        } catch (error) {
            console.error("Failed to toggle tax:", error);
        }
    };

    // Group taxes by country
    const groupedTaxes = taxes.reduce((acc, tax) => {
        if (!acc[tax.country]) acc[tax.country] = [];
        acc[tax.country].push(tax);
        return acc;
    }, {} as Record<string, TaxRate[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tax Rates</h1>
                    <p className="text-gray-500 mt-1">Configure tax rates by region</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingId(null); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Tax Rate
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-semibold mb-4">{editingId ? "Edit Tax Rate" : "Add Tax Rate"}</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="e.g., GST, CGST"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Rate (%)</label>
                            <input
                                type="number"
                                value={formData.rate}
                                onChange={(e) => setFormData(p => ({ ...p, rate: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                min={0}
                                max={100}
                                step={0.1}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Country Code</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData(p => ({ ...p, country: e.target.value.toUpperCase() }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="IN, US, UK"
                                maxLength={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">State (optional)</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="e.g., MH, CA"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Apply To</label>
                            <select
                                value={formData.applyTo}
                                onChange={(e) => setFormData(p => ({ ...p, applyTo: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            >
                                <option value="all">All Items</option>
                                <option value="products">Products Only</option>
                                <option value="courses">Courses Only</option>
                                <option value="workshops">Workshops Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Display Name</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="Shown on invoice"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isInclusive}
                                    onChange={(e) => setFormData(p => ({ ...p, isInclusive: e.target.checked }))}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm">Tax is included in price (inclusive pricing)</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                        <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Taxes List */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold">Tax Rates ({taxes.length})</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" /></div>
                ) : taxes.length === 0 ? (
                    <div className="p-12 text-center">
                        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No tax rates configured</p>
                    </div>
                ) : (
                    Object.entries(groupedTaxes).map(([country, countryTaxes]) => (
                        <div key={country} className="border-b border-gray-100 last:border-0">
                            <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-700">{country}</span>
                                <span className="text-sm text-gray-500">({countryTaxes.length} rates)</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {countryTaxes.map((tax) => (
                                    <div key={tax._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Percent className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{tax.name}</p>
                                                    {tax.state && <span className="text-xs text-gray-500">({tax.state})</span>}
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">{tax.rate}%</span>
                                                    {tax.isInclusive && <span className="text-xs text-gray-400">inclusive</span>}
                                                </div>
                                                <p className="text-sm text-gray-500">Applies to: {tax.applyTo}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(tax)}
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${tax.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                            >
                                                {tax.isActive ? "Active" : "Inactive"}
                                            </button>
                                            <button onClick={() => handleEdit(tax)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => confirmModal.confirm({
                                                title: "Delete Tax Rate",
                                                message: "Delete this tax rate? This action cannot be undone.",
                                                confirmText: "Delete",
                                                onConfirm: () => handleDelete(tax._id),
                                            })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
