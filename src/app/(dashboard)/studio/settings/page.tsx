"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import { Save, User, CreditCard, Bell, DollarSign, Plus, Trash2, Building2, Smartphone } from "lucide-react";
import { useCurrency, type Currency } from "@/context/CurrencyContext";
import { ThumbnailUploader } from "@/components/molecules/ThumbnailUploader";

// Define types based on API
interface PayoutMethod {
    _id?: string;
    type: "bank_account" | "upi";
    details: {
        accountNumber?: string;
        ifsc?: string;
        accountHolderName?: string;
        bankName?: string;
        upiId?: string;
    };
    isDefault: boolean;
}

interface UserProfile {
    name: string;
    avatar?: string;
    bio?: string;
    profile: {
        phone?: string;
        location?: string;
        website?: string;
        socialLinks?: Record<string, string>;
    };
    studioProfile: {
        name?: string;
        description?: string;
        coverImage?: string;
        specializations?: string[];
    };
    preferences: {
        currency: string;
        emailNotifications: boolean;
        pushNotifications: boolean;
    };
    payoutMethods: PayoutMethod[];
}

const CURRENCIES = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
] as const;

export default function SettingsPage() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const { setCurrency } = useCurrency();

    // Form State
    const [data, setData] = React.useState<UserProfile>({
        name: "",
        profile: {},
        studioProfile: {},
        preferences: { currency: "INR", emailNotifications: true, pushNotifications: true },
        payoutMethods: []
    });

    // Payout Method Form State
    const [showAddPayout, setShowAddPayout] = React.useState(false);
    const [newPayout, setNewPayout] = React.useState<Partial<PayoutMethod>>({ type: "bank_account", details: {}, isDefault: false });

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");
                const json = await res.json();
                if (res.ok && json.user) {
                    const user = json.user;
                    // Merge with default structure to prevent undefined access
                    setData({
                        name: user.name || "",
                        avatar: user.avatar,
                        bio: user.bio,
                        profile: user.profile || {},
                        studioProfile: user.studioProfile || {},
                        preferences: user.preferences || { currency: "INR", emailNotifications: true, pushNotifications: true },
                        payoutMethods: user.payoutMethods || []
                    });

                    // Sync global currency context
                    if (user.preferences?.currency) {
                        setCurrency(user.preferences.currency as Currency);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [setCurrency]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    bio: data.bio,
                    avatar: data.avatar,
                    profile: data.profile,
                    studioProfile: data.studioProfile,
                    preferences: data.preferences,
                    payoutMethods: data.payoutMethods
                })
            });

            if (res.ok) {
                // Update global currency if changed
                if (data.preferences.currency) {
                    setCurrency(data.preferences.currency as Currency);
                }
                alert("Settings saved successfully!");
            } else {
                alert("Failed to save settings.");
            }
        } catch (error) {
            console.error("Error saving profile", error);
            alert("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddPayout = () => {
        if (!newPayout.details) return;

        // Basic validation
        if (newPayout.type === "bank_account") {
            if (!newPayout.details.accountNumber || !newPayout.details.ifsc) {
                alert("Please fill in Account Number and IFSC");
                return;
            }
        } else {
            if (!newPayout.details.upiId) {
                alert("Please fill in UPI ID");
                return;
            }
        }

        setData(prev => ({
            ...prev,
            payoutMethods: [...prev.payoutMethods, newPayout as PayoutMethod]
        }));

        setShowAddPayout(false);
        setNewPayout({ type: "bank_account", details: {}, isDefault: false });
    };

    const removePayoutMethod = (index: number) => {
        const updated = [...data.payoutMethods];
        updated.splice(index, 1);
        setData({ ...data, payoutMethods: updated });
    };

    if (loading) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20 py-4 px-1 -mx-1 border-b border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Studio Settings</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage your studio profile and preferences</p>
                </div>
                <Button onClick={handleSave} disabled={saving} isLoading={saving} className="shadow-lg shadow-primary/20">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Profile & Branding (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Studio Branding Card */}
                    <Card className="overflow-hidden border-0 shadow-md ring-1 ring-gray-100">
                        {/* Cover Image Section - Full Width */}
                        <div className="relative h-48 bg-gray-50 border-b border-gray-100">
                            <ThumbnailUploader
                                existingImage={data.studioProfile.coverImage ? { url: data.studioProfile.coverImage, filename: "Cover" } : undefined}
                                onUploadComplete={(img) => setData({
                                    ...data,
                                    studioProfile: { ...data.studioProfile, coverImage: img.url }
                                })}
                                className="h-full w-full rounded-none border-0"
                            />
                            {/* Overlay hint if empty */}
                            {!data.studioProfile.coverImage && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400">
                                    <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                        Cover Image (1280x320)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Avatar & Basic Info Container */}
                        <div className="px-8 pb-8">
                            <div className="flex flex-col sm:flex-row gap-6 items-start -mt-12 mb-8 relative z-10">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="rounded-full p-1 bg-white shadow-xl ring-1 ring-gray-100 w-32 h-32">
                                        <ThumbnailUploader
                                            variant="avatar"
                                            existingImage={data.avatar ? { url: data.avatar, filename: "Avatar" } : undefined}
                                            onUploadComplete={(img) => setData({ ...data, avatar: img.url })}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>

                                {/* Header Text Inputs (Name & Bio) */}
                                <div className="flex-1 mt-14 sm:mt-14 space-y-4 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Your Name</label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData({ ...data, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent font-medium"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Studio Name</label>
                                            <input
                                                type="text"
                                                value={data.studioProfile.name || ""}
                                                onChange={(e) => setData({
                                                    ...data,
                                                    studioProfile: { ...data.studioProfile, name: e.target.value }
                                                })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent font-medium"
                                                placeholder="Creative Arts Studio"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Form Fields */}
                            <div className="space-y-6 border-t border-gray-100 pt-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            Professional Bio
                                        </label>
                                        <textarea
                                            value={data.bio || ""}
                                            onChange={(e) => setData({ ...data, bio: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-h-[80px]"
                                            rows={2}
                                            placeholder="Tell us a bit about yourself..."
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            Studio Description
                                        </label>
                                        <textarea
                                            value={data.studioProfile.description || ""}
                                            onChange={(e) => setData({
                                                ...data,
                                                studioProfile: { ...data.studioProfile, description: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-h-[120px]"
                                            rows={4}
                                            placeholder="Describe your studio, your process, and what makes your work unique..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Website</label>
                                        <input
                                            type="url"
                                            value={data.profile.website || ""}
                                            onChange={(e) => setData({
                                                ...data,
                                                profile: { ...data.profile, website: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Location</label>
                                        <input
                                            type="text"
                                            value={data.profile.location || ""}
                                            onChange={(e) => setData({
                                                ...data,
                                                profile: { ...data.profile, location: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                            placeholder="City, Country"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Settings */}
                    <Card className="p-0 overflow-hidden border-0 shadow-md ring-1 ring-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 text-emerald-600 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">Payout Methods</h2>
                                        <p className="text-sm text-gray-500">Manage how you get paid</p>
                                    </div>
                                </div>
                                {!showAddPayout && (
                                    <Button size="sm" variant="outline" onClick={() => setShowAddPayout(true)} className="bg-white hover:bg-gray-50">
                                        <Plus className="w-4 h-4 mr-2" /> Add Method
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* List Existing Methods */}
                            <div className="grid grid-cols-1 gap-4">
                                {data.payoutMethods.map((method, idx) => (
                                    <div key={idx} className="group flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-emerald-200 hover:shadow-emerald-50/50 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${method.type === 'bank_account' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                {method.type === "bank_account" ? <Building2 className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 capitalize">{method.type.replace("_", " ")}</p>
                                                <p className="text-sm text-gray-500 font-mono mt-0.5">
                                                    {method.type === "bank_account"
                                                        ? `${method.details.bankName} •••• ${method.details.accountNumber?.slice(-4)}`
                                                        : method.details.upiId}
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => removePayoutMethod(idx)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                {data.payoutMethods.length === 0 && !showAddPayout && (
                                    <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="font-medium text-gray-900">No payout methods yet</p>
                                        <p className="text-sm text-gray-500 mb-4">Add a bank account or UPI ID to verify your studio.</p>
                                        <Button size="sm" onClick={() => setShowAddPayout(true)}>Add First Method</Button>
                                    </div>
                                )}
                            </div>

                            {/* Add New Method Form */}
                            {showAddPayout && (
                                <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-emerald-600" />
                                        Add New Payout Method
                                    </h3>

                                    <div className="flex gap-4 mb-6">
                                        <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${newPayout.type === "bank_account" ? "bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20" : "bg-white/50 border-gray-200 hover:bg-white"}`}>
                                            <input
                                                type="radio"
                                                name="type"
                                                className="hidden"
                                                checked={newPayout.type === "bank_account"}
                                                onChange={() => setNewPayout({ type: "bank_account", details: {}, isDefault: false })}
                                            />
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-sm">Bank Account</span>
                                        </label>

                                        <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${newPayout.type === "upi" ? "bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20" : "bg-white/50 border-gray-200 hover:bg-white"}`}>
                                            <input
                                                type="radio"
                                                name="type"
                                                className="hidden"
                                                checked={newPayout.type === "upi"}
                                                onChange={() => setNewPayout({ type: "upi", details: {}, isDefault: false })}
                                            />
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Smartphone className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-sm">UPI ID</span>
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        {newPayout.type === "bank_account" ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <input
                                                            placeholder="Bank Name"
                                                            value={newPayout.details?.bankName || ""}
                                                            onChange={e => setNewPayout(p => ({ ...p, details: { ...p.details, bankName: e.target.value } }))}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <input
                                                            placeholder="Account Holder Name"
                                                            value={newPayout.details?.accountHolderName || ""}
                                                            onChange={e => setNewPayout(p => ({ ...p, details: { ...p.details, accountHolderName: e.target.value } }))}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                        />
                                                    </div>
                                                    <input
                                                        placeholder="Account Number"
                                                        value={newPayout.details?.accountNumber || ""}
                                                        onChange={e => setNewPayout(p => ({ ...p, details: { ...p.details, accountNumber: e.target.value } }))}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    />
                                                    <input
                                                        placeholder="IFSC Code"
                                                        value={newPayout.details?.ifsc || ""}
                                                        onChange={e => setNewPayout(p => ({ ...p, details: { ...p.details, ifsc: e.target.value } }))}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <input
                                                placeholder="UPI ID (e.g. name@upi)"
                                                value={newPayout.details?.upiId || ""}
                                                onChange={e => setNewPayout(p => ({ ...p, details: { ...p.details, upiId: e.target.value } }))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                            />
                                        )}

                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button size="sm" variant="ghost" onClick={() => setShowAddPayout(false)} className="hover:bg-red-50 hover:text-red-600">Cancel</Button>
                                            <Button size="sm" onClick={handleAddPayout} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-lg">Save Method</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Preferences (4 cols) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Currency & Display */}


                    {/* Notification Settings */}
                    <Card className="p-6 border-0 shadow-md ring-1 ring-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center ring-1 ring-purple-100">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">Notifications</h2>
                                <p className="text-xs text-gray-500">Alert preferences</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer hover:bg-purple-50/50 transition-colors group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Email Notifications</span>
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-5 w-5"
                                    checked={data.preferences.emailNotifications}
                                    onChange={(e) => setData({
                                        ...data,
                                        preferences: { ...data.preferences, emailNotifications: e.target.checked }
                                    })}
                                />
                            </label>

                            <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer hover:bg-purple-50/50 transition-colors group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Push Notifications</span>
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-5 w-5"
                                    checked={data.preferences.pushNotifications}
                                    onChange={(e) => setData({
                                        ...data,
                                        preferences: { ...data.preferences, pushNotifications: e.target.checked }
                                    })}
                                />
                            </label>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
