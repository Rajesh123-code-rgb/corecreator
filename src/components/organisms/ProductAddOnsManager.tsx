"use client";

import * as React from "react";
import { Plus, Trash2, Gift, Zap, Package, Check } from "lucide-react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface AddOn {
    id: string;
    title: string;
    description: string;
    price: number;
    active: boolean;
}

interface ProductAddOnsManagerProps {
    addOns: AddOn[];
    onChange: (addOns: AddOn[]) => void;
}

// Preset add-ons that sellers can quickly enable
const PRESET_ADDONS = [
    { id: "gift-wrap", title: "Gift Wrapping", description: "Elegant gift wrap with ribbon and personalized card", price: 5.99, icon: Gift },
    { id: "rush-order", title: "Rush Processing", description: "Move to front of production queue (2-3 days)", price: 15.00, icon: Zap },
    { id: "insured-shipping", title: "Insurance", description: "Full value shipping insurance", price: 8.99, icon: Package },
];

export default function ProductAddOnsManager({ addOns, onChange }: ProductAddOnsManagerProps) {
    const [showCustomForm, setShowCustomForm] = React.useState(false);
    const [newAddOn, setNewAddOn] = React.useState<Partial<AddOn>>({
        title: "",
        description: "",
        price: 0
    });

    const togglePresetAddOn = (presetId: string) => {
        const preset = PRESET_ADDONS.find(p => p.id === presetId);
        if (!preset) return;

        const existing = addOns.find(a => a.id === presetId);
        if (existing) {
            // Toggle active status
            const updated = addOns.map(a =>
                a.id === presetId ? { ...a, active: !a.active } : a
            );
            onChange(updated);
        } else {
            // Add preset
            onChange([...addOns, {
                id: preset.id,
                title: preset.title,
                description: preset.description,
                price: preset.price,
                active: true
            }]);
        }
    };

    const addCustomAddOn = () => {
        if (!newAddOn.title) return;

        const customAddOn: AddOn = {
            id: `custom-${Date.now()}`,
            title: newAddOn.title || "",
            description: newAddOn.description || "",
            price: newAddOn.price || 0,
            active: true
        };

        onChange([...addOns, customAddOn]);
        setNewAddOn({ title: "", description: "", price: 0 });
        setShowCustomForm(false);
    };

    const removeAddOn = (id: string) => {
        onChange(addOns.filter(a => a.id !== id));
    };

    const updateAddOn = (id: string, field: keyof AddOn, value: any) => {
        const updated = addOns.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        );
        onChange(updated);
    };

    const isPresetEnabled = (presetId: string) => {
        const existing = addOns.find(a => a.id === presetId);
        return existing?.active || false;
    };

    return (
        <div className="space-y-6">
            {/* Preset Add-ons */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    Quick Add-ons
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    Enable popular add-ons with one click. Prices can be customized.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRESET_ADDONS.map((preset) => {
                        const enabled = isPresetEnabled(preset.id);
                        const currentAddOn = addOns.find(a => a.id === preset.id);

                        return (
                            <div
                                key={preset.id}
                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${enabled
                                        ? "border-amber-500 bg-amber-50"
                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                    }`}
                                onClick={() => togglePresetAddOn(preset.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${enabled ? "bg-amber-100" : "bg-gray-100"}`}>
                                        <preset.icon className={`w-5 h-5 ${enabled ? "text-amber-600" : "text-gray-500"}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{preset.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">
                                                ${(currentAddOn?.price || preset.price).toFixed(2)}
                                            </span>
                                            {enabled && (
                                                <input
                                                    type="number"
                                                    className="w-20 h-6 px-2 text-xs border rounded"
                                                    value={currentAddOn?.price || preset.price}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateAddOn(preset.id, "price", parseFloat(e.target.value) || 0);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {enabled && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Custom Add-ons */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-amber-500" />
                            Custom Add-ons
                        </h3>
                        <p className="text-sm text-gray-500">Create unique add-on products specific to your artwork.</p>
                    </div>
                    <Button variant="outline" onClick={() => setShowCustomForm(!showCustomForm)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom
                    </Button>
                </div>

                {/* Add Custom Form */}
                {showCustomForm && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                                <Input
                                    value={newAddOn.title}
                                    onChange={(e) => setNewAddOn({ ...newAddOn, title: e.target.value })}
                                    placeholder="e.g. Certificate of Authenticity"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                <Input
                                    value={newAddOn.description}
                                    onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
                                    placeholder="Brief description"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Price ($)</label>
                                <Input
                                    type="number"
                                    value={newAddOn.price}
                                    onChange={(e) => setNewAddOn({ ...newAddOn, price: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowCustomForm(false)}>Cancel</Button>
                            <Button size="sm" onClick={addCustomAddOn}>Add Add-on</Button>
                        </div>
                    </div>
                )}

                {/* Custom Add-ons List */}
                {addOns.filter(a => a.id.startsWith("custom-")).length > 0 ? (
                    <div className="space-y-3">
                        {addOns.filter(a => a.id.startsWith("custom-")).map((addOn) => (
                            <div key={addOn.id} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg group">
                                <input
                                    type="checkbox"
                                    checked={addOn.active}
                                    onChange={(e) => updateAddOn(addOn.id, "active", e.target.checked)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                />
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900">{addOn.title}</span>
                                    {addOn.description && (
                                        <span className="text-sm text-gray-500 ml-2">— {addOn.description}</span>
                                    )}
                                </div>
                                <span className="font-semibold text-gray-900">${addOn.price.toFixed(2)}</span>
                                <button
                                    onClick={() => removeAddOn(addOn.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    !showCustomForm && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No custom add-ons yet. Click "Add Custom" to create one.</p>
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}
