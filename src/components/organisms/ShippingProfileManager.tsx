"use client";

import * as React from "react";
import { Plus, Trash2, Edit2, Check, Globe, Truck, X } from "lucide-react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface ShippingRate {
    name: string;
    type: "flat" | "weight_based" | "price_based" | "free";
    amount: number;
    minWeight?: number;
    maxWeight?: number;
    minPrice?: number;
    maxPrice?: number;
}

interface ShippingZone {
    name: string;
    countries: string[];
    rates: ShippingRate[];
}

interface ShippingProfile {
    _id: string;
    name: string;
    zones: ShippingZone[];
    processingTime?: string;
    isDefault: boolean;
}

export default function ShippingProfileManager() {
    const [profiles, setProfiles] = React.useState<ShippingProfile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [isCreating, setIsCreating] = React.useState(false);

    // Form State
    const [formData, setFormData] = React.useState<Partial<ShippingProfile>>({
        name: "",
        zones: [],
        isDefault: false
    });

    React.useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const res = await fetch("/api/studio/shipping/profiles");
            if (res.ok) {
                const data = await res.json();
                setProfiles(data.profiles || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const url = editingId
                ? `/api/studio/shipping/profiles/${editingId}`
                : "/api/studio/shipping/profiles";

            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchProfiles();
                setEditingId(null);
                setIsCreating(false);
                setFormData({ name: "", zones: [], isDefault: false });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/studio/shipping/profiles/${id}`, { method: "DELETE" });
            fetchProfiles();
        } catch (err) {
            console.error(err);
        }
    };

    const startEdit = (profile: ShippingProfile) => {
        setEditingId(profile._id);
        setFormData(profile);
        setIsCreating(true);
    };

    const addZone = () => {
        const newZone: ShippingZone = { name: "New Zone", countries: [], rates: [] };
        setFormData(prev => ({ ...prev, zones: [...(prev.zones || []), newZone] }));
    };

    const updateZone = (index: number, zone: ShippingZone) => {
        const newZones = [...(formData.zones || [])];
        newZones[index] = zone;
        setFormData(prev => ({ ...prev, zones: newZones }));
    };

    const removeZone = (index: number) => {
        const newZones = [...(formData.zones || [])];
        newZones.splice(index, 1);
        setFormData(prev => ({ ...prev, zones: newZones }));
    };

    if (loading) return <div>Loading profiles...</div>;

    if (isCreating || editingId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{editingId ? "Edit Profile" : "Create Profile"}</h2>
                    <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingId(null); }}>Cancel</Button>
                </div>

                <Card className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Profile Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Standard Shipping"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default profile</label>
                    </div>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Shipping Zones</h3>
                        <Button size="sm" onClick={addZone} variant="outline"><Plus className="w-4 h-4 mr-1" /> Add Zone</Button>
                    </div>

                    {formData.zones?.map((zone, idx) => (
                        <Card key={idx} className="p-4 border-l-4 border-l-amber-500">
                            <div className="flex justify-between items-start mb-4">
                                <Input
                                    value={zone.name}
                                    onChange={(e) => updateZone(idx, { ...zone, name: e.target.value })}
                                    className="max-w-xs font-semibold"
                                    placeholder="Zone Name"
                                />
                                <Button variant="ghost" size="sm" onClick={() => removeZone(idx)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-gray-500">Countries (comma separated codes)</label>
                                    <Input
                                        value={zone.countries.join(", ")}
                                        onChange={(e) => updateZone(idx, { ...zone, countries: e.target.value.split(",").map(c => c.trim().toUpperCase()) })}
                                        placeholder="US, CA, GB..."
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold uppercase text-gray-500">Rates</label>
                                        <Button size="sm" variant="outline" onClick={() => {
                                            const newRate: ShippingRate = { name: "Standard", type: "flat", amount: 0 };
                                            updateZone(idx, { ...zone, rates: [...zone.rates, newRate] });
                                        }}>
                                            <Plus className="w-3 h-3 mr-1" /> Add Rate
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {zone.rates.map((rate, rIdx) => (
                                            <div key={rIdx} className="flex gap-2 items-center bg-gray-50 p-2 rounded">
                                                <Input
                                                    value={rate.name}
                                                    onChange={(e) => {
                                                        const newRates = [...zone.rates];
                                                        newRates[rIdx].name = e.target.value;
                                                        updateZone(idx, { ...zone, rates: newRates });
                                                    }}
                                                    placeholder="Rate Name"
                                                    className="w-1/3"
                                                />
                                                <Input
                                                    type="number"
                                                    value={rate.amount}
                                                    onChange={(e) => {
                                                        const newRates = [...zone.rates];
                                                        newRates[rIdx].amount = parseFloat(e.target.value);
                                                        updateZone(idx, { ...zone, rates: newRates });
                                                    }}
                                                    placeholder="Price"
                                                    className="w-24"
                                                />
                                                <Button size="sm" variant="ghost" onClick={() => {
                                                    const newRates = [...zone.rates];
                                                    newRates.splice(rIdx, 1);
                                                    updateZone(idx, { ...zone, rates: newRates });
                                                }}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} className="gradient-gold text-white">Save Profile</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Shipping Profiles</h2>
                    <p className="text-sm text-gray-500">Manage your shipping zones and rates</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="gradient-gold text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Profile
                </Button>
            </div>

            <div className="grid gap-4">
                {profiles.map(profile => (
                    <Card key={profile._id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-amber-50 rounded text-amber-600">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                                    {profile.isDefault && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Default</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{profile.zones.length} Zones defined</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(profile)}>
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(profile._id)} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}

                {profiles.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-gray-900 font-medium">No shipping profiles</h3>
                        <p className="text-gray-500 text-sm mb-4">Create a shipping profile to define where you ship and how much it costs.</p>
                        <Button onClick={() => setIsCreating(true)} variant="outline">Create First Profile</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
