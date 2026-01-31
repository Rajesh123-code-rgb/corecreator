"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { useConfirmModal, useToast } from "@/components/molecules";
import {
    Truck,
    Plus,
    Loader2,
    Edit,
    Trash2,
    Globe,
    MapPin,
    DollarSign,
    Clock
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface ShippingRate {
    name: string;
    type: "flat" | "weight_based" | "price_based" | "free";
    amount: number;
    estimatedDays: { min: number; max: number };
}

interface ShippingZone {
    _id: string;
    name: string;
    countries: string[];
    states: string[];
    rates: ShippingRate[];
    isActive: boolean;
    isDefault: boolean;
}

export default function AdminShippingPage() {
    const [zones, setZones] = React.useState<ShippingZone[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        name: "",
        countries: "",
        rates: [{ name: "Standard", type: "flat", amount: 0, estimatedDays: { min: 5, max: 7 } }] as ShippingRate[],
        isDefault: false,
    });
    const [submitting, setSubmitting] = React.useState(false);
    const confirmModal = useConfirmModal();
    const { formatPrice, symbol } = useCurrency();
    const toast = useToast();

    const fetchZones = React.useCallback(async () => {
        try {
            const res = await fetch("/api/admin/shipping");
            if (res.ok) {
                const data = await res.json();
                setZones(data.zones || []);
            }
        } catch (error) {
            console.error("Failed to fetch zones:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return;
        setSubmitting(true);
        try {
            const url = "/api/admin/shipping";
            const method = editingId ? "PUT" : "POST";
            const countries = formData.countries.split(",").map(c => c.trim()).filter(Boolean);
            const body = editingId
                ? { id: editingId, ...formData, countries }
                : { ...formData, countries };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    name: "",
                    countries: "",
                    rates: [{ name: "Standard", type: "flat", amount: 0, estimatedDays: { min: 5, max: 7 } }],
                    isDefault: false,
                });
                fetchZones();
            }
        } catch (error) {
            console.error("Failed to save zone:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (zone: ShippingZone) => {
        setFormData({
            name: zone.name,
            countries: zone.countries.join(", "),
            rates: zone.rates.length > 0 ? zone.rates : [{ name: "Standard", type: "flat", amount: 0, estimatedDays: { min: 5, max: 7 } }],
            isDefault: zone.isDefault,
        });
        setEditingId(zone._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/shipping?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchZones();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            console.error("Failed to delete zone:", error);
        }
    };

    const updateRate = (index: number, field: string, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            rates: prev.rates.map((r, i) => i === index ? { ...r, [field]: value } : r),
        }));
    };

    const addRate = () => {
        setFormData(prev => ({
            ...prev,
            rates: [...prev.rates, { name: "", type: "flat", amount: 0, estimatedDays: { min: 5, max: 7 } }],
        }));
    };

    const removeRate = (index: number) => {
        setFormData(prev => ({
            ...prev,
            rates: prev.rates.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shipping Zones</h1>
                    <p className="text-gray-500 mt-1">Configure shipping rates by region</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingId(null); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Zone
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="font-semibold mb-4">{editingId ? "Edit Zone" : "Add Shipping Zone"}</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Zone Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    placeholder="e.g., India, International"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Countries (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.countries}
                                    onChange={(e) => setFormData(p => ({ ...p, countries: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    placeholder="IN, US, UK"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium">Shipping Rates</label>
                                <button onClick={addRate} className="text-sm text-purple-600 hover:text-purple-700">+ Add Rate</button>
                            </div>
                            <div className="space-y-2">
                                {formData.rates.map((rate, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={rate.name}
                                            onChange={(e) => updateRate(index, "name", e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="Rate name"
                                        />
                                        <select
                                            value={rate.type}
                                            onChange={(e) => updateRate(index, "type", e.target.value)}
                                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        >
                                            <option value="flat">Flat Rate</option>
                                            <option value="free">Free</option>
                                            <option value="weight_based">Weight Based</option>
                                            <option value="price_based">Price Based</option>
                                        </select>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-gray-500">{symbol}</span>
                                            <input
                                                type="number"
                                                value={rate.amount}
                                                onChange={(e) => updateRate(index, "amount", parseFloat(e.target.value))}
                                                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                disabled={rate.type === "free"}
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            value={rate.estimatedDays.min}
                                            onChange={(e) => updateRate(index, "estimatedDays", { ...rate.estimatedDays, min: parseInt(e.target.value) })}
                                            className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center"
                                            placeholder="Min"
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="number"
                                            value={rate.estimatedDays.max}
                                            onChange={(e) => updateRate(index, "estimatedDays", { ...rate.estimatedDays, max: parseInt(e.target.value) })}
                                            className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center"
                                            placeholder="Max"
                                        />
                                        <span className="text-sm text-gray-500">days</span>
                                        {formData.rates.length > 1 && (
                                            <button onClick={() => removeRate(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData(p => ({ ...p, isDefault: e.target.checked }))}
                                className="rounded border-gray-300"
                            />
                            <span className="text-sm">Set as default zone</span>
                        </label>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {editingId ? "Update" : "Create"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Zones List */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold">Shipping Zones ({zones.length})</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" /></div>
                ) : zones.length === 0 ? (
                    <div className="p-12 text-center">
                        <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No shipping zones configured</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {zones.map((zone) => (
                            <div key={zone._id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Globe className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900">{zone.name}</p>
                                                {zone.isDefault && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Default</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {zone.countries.length > 0 ? zone.countries.join(", ") : "All countries"}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {zone.rates.map((rate, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                                        <DollarSign className="w-3 h-3" />
                                                        {rate.name}: {rate.type === "free" ? "Free" : formatPrice(rate.amount)}
                                                        <Clock className="w-3 h-3 ml-1" />
                                                        {rate.estimatedDays.min}-{rate.estimatedDays.max}d
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(zone)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {!zone.isDefault && (
                                            <button onClick={() => confirmModal.confirm({
                                                title: "Delete Shipping Zone",
                                                message: `Delete "${zone.name}"? This action cannot be undone.`,
                                                confirmText: "Delete",
                                                onConfirm: () => handleDelete(zone._id),
                                            })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
