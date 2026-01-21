"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    Plus,
    Trash2,
    Save,
    Loader2,
    Percent,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import { useConfirmModal } from "@/components/molecules";

interface TaxRate {
    _id?: string;
    name: string;
    rate: number;
    country: string;
    region?: string;
    isActive: boolean;
    description?: string;
}

export default function TaxSettingsPage() {
    const [taxes, setTaxes] = React.useState<TaxRate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [newTax, setNewTax] = React.useState<Partial<TaxRate>>({
        name: "",
        rate: 0,
        country: "IN",
        isActive: true
    });
    const confirmModal = useConfirmModal();

    const fetchTaxes = async () => {
        try {
            const res = await fetch("/api/admin/settings/taxes");
            if (res.ok) {
                const data = await res.json();
                setTaxes(data.taxes);
            }
        } catch (error) {
            console.error("Failed to fetch taxes", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTaxes();
    }, []);

    const handleAddTax = async () => {
        if (!newTax.name || newTax.rate === undefined) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings/taxes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTax),
            });
            if (res.ok) {
                await fetchTaxes();
                setNewTax({ name: "", rate: 0, country: "IN", isActive: true });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTax = async (id: string) => {
        confirmModal.confirm({
            title: "Delete Tax Rate",
            message: "Are you sure you want to delete this tax rate? This action cannot be undone.",
            confirmText: "Delete",
            variant: "danger",
            onConfirm: async () => {
                try {
                    await fetch(`/api/admin/settings/taxes?id=${id}`, { method: "DELETE" });
                    setTaxes(prev => prev.filter(t => t._id !== id));
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tax Rates</h1>
                <p className="text-gray-500 mt-1">Configure tax slabs for different regions</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4">Add New Tax Rate</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-gray-50 p-4 rounded-lg">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            placeholder="e.g. GST Standard"
                            value={newTax.name}
                            onChange={e => setNewTax({ ...newTax, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Rate (%)</label>
                        <input
                            type="number"
                            placeholder="18"
                            value={newTax.rate}
                            onChange={e => setNewTax({ ...newTax, rate: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Country Code</label>
                        <input
                            type="text"
                            placeholder="IN"
                            value={newTax.country}
                            onChange={e => setNewTax({ ...newTax, country: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase"
                        />
                    </div>
                    <Button onClick={handleAddTax} disabled={saving || !newTax.name || !newTax.country}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Add Rate
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Country</th>
                            <th className="px-6 py-4">Rate</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {taxes.map((tax) => (
                            <tr key={tax._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{tax.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{tax.country} {tax.region ? `(${tax.region})` : ""}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                                        {tax.rate}%
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tax.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {tax.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteTax(tax._id!)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {taxes.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-500">
                        <Percent className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No tax rates configured</p>
                    </div>
                )}
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
