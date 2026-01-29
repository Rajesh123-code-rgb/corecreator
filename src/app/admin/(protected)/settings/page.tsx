"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    Save,
    Globe,
    Mail,
    CreditCard,
    Shield,
    Bell,
    Palette,
    Database,
    Loader2,
    CheckCircle,
    AlertCircle,
    Server,
    Percent,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

const settingsSections = [
    { id: "general", label: "General", icon: Globe },
    { id: "email", label: "Email", icon: Mail },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "backup", label: "Backup & Data", icon: Database },
    { id: "system", label: "System Flags", icon: Server },
    { id: "taxes", label: "Tax Rates", icon: Percent },
    { id: "team", label: "Team Access", icon: Users },
];

interface PlatformSettings {
    general?: {
        siteName: string;
        siteDescription: string;
        defaultCurrency: string;
        timezone: string;
    };
    commission?: {
        platformCommission: number;
        paymentProcessingFee: number;
        minimumPayoutAmount: number;
        payoutSchedule: string;
        payoutHoldDays: number;
    };
    payments?: {
        razorpay: {
            enabled: boolean;
            testMode: boolean;
            keyId: string;
            keySecret: string;
            webhookSecret: string;
        };
        stripe: {
            enabled: boolean;
            testMode: boolean;
            publishableKey: string;
            secretKey: string;
            webhookSecret: string;
        };
    };
    email?: {
        smtpHost: string;
        smtpPort: number;
        fromEmail: string;
        encryption: string;
        // fixed
    };
    security?: {
        require2FAForAdmins: boolean;
        loginRateLimiting: boolean;
        contentModeration: boolean;
    };
    notifications?: {
        emailOnNewOrder: boolean;
        emailOnNewUser: boolean;
        emailOnPayout: boolean;
    };
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = React.useState("general");
    const [settings, setSettings] = React.useState<PlatformSettings>({});
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle");
    const [hasChanges, setHasChanges] = React.useState(false);

    // Fetch settings on mount
    React.useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings || {});
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: string, data: Record<string, unknown>) => {
        setSaving(true);
        setSaveStatus("idle");
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ section, data }),
            });

            if (res.ok) {
                setSaveStatus("success");
                setHasChanges(false);
                // Refresh settings
                await fetchSettings();
                setTimeout(() => setSaveStatus("idle"), 3000);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save settings");
                setSaveStatus("error");
            }
        } catch (error) {
            console.error("Failed to save:", error);
            setSaveStatus("error");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (section: keyof PlatformSettings, field: string, value: unknown) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as Record<string, unknown> || {}),
                [field]: value
            }
        }));
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600">Manage platform configuration</p>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus === "success" && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" /> Saved
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" /> Error
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0 hidden lg:block">
                    <div className="bg-white rounded-xl border border-gray-100 p-2">
                        {settingsSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    if (section.id === "system") {
                                        router.push("/admin/settings/system");
                                    } else if (section.id === "taxes") {
                                        router.push("/admin/settings/taxes");
                                    } else {
                                        setActiveSection(section.id);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                                    ? "bg-purple-100 text-purple-700"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <section.icon className="w-5 h-5" />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* General Settings */}
                    {activeSection === "general" && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">General Settings</h3>
                                <Button
                                    onClick={() => handleSave("general", settings.general || {})}
                                    disabled={saving}
                                    size="sm"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save
                                </Button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Site Name</label>
                                    <input
                                        type="text"
                                        value={settings.general?.siteName || ""}
                                        onChange={(e) => updateField("general", "siteName", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Site Description</label>
                                    <textarea
                                        rows={3}
                                        value={settings.general?.siteDescription || ""}
                                        onChange={(e) => updateField("general", "siteDescription", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Timezone</label>
                                        <select
                                            value={settings.general?.timezone || "Asia/Kolkata"}
                                            onChange={(e) => updateField("general", "timezone", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        >
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">America/New_York</option>
                                            <option value="Europe/London">Europe/London</option>
                                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Settings with Commission */}
                    {activeSection === "payments" && (
                        <div className="space-y-6">
                            {/* Commission Settings */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold">Commission & Payout Settings</h3>
                                    <Button
                                        onClick={() => handleSave("commission", settings.commission || {})}
                                        disabled={saving}
                                        size="sm"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save
                                    </Button>
                                </div>
                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Platform Commission (%)</label>
                                            <input
                                                type="number"
                                                value={settings.commission?.platformCommission ?? 12}
                                                onChange={(e) => updateField("commission", "platformCommission", parseFloat(e.target.value))}
                                                min={0}
                                                max={50}
                                                step={0.1}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Fee charged to studios per sale</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Payment Processing Fee (%)</label>
                                            <input
                                                type="number"
                                                value={settings.commission?.paymentProcessingFee ?? 2.9}
                                                onChange={(e) => updateField("commission", "paymentProcessingFee", parseFloat(e.target.value))}
                                                min={0}
                                                max={10}
                                                step={0.1}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Gateway fees (Razorpay/Stripe)</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Minimum Payout Amount</label>
                                            <input
                                                type="number"
                                                value={settings.commission?.minimumPayoutAmount ?? 500}
                                                onChange={(e) => updateField("commission", "minimumPayoutAmount", parseInt(e.target.value))}
                                                min={1}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Payout Schedule</label>
                                            <select
                                                value={settings.commission?.payoutSchedule || "weekly"}
                                                onChange={(e) => updateField("commission", "payoutSchedule", e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            >
                                                <option value="weekly">Weekly</option>
                                                <option value="biweekly">Bi-weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="manual">Manual Only</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <p className="text-sm text-purple-800">
                                            <strong>Summary:</strong> Studios receive <strong>
                                                {(100 - (settings.commission?.platformCommission ?? 12) - (settings.commission?.paymentProcessingFee ?? 2.9)).toFixed(1)}%
                                            </strong> of each sale
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Gateways */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold mb-6">Payment Gateways</h3>

                                {/* Razorpay */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">R</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">Razorpay</p>
                                                <p className="text-sm text-blue-600">Primary Payment Gateway</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${settings.payments?.razorpay?.enabled
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-700"}`}>
                                            {settings.payments?.razorpay?.enabled ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Key ID</label>
                                            <input
                                                type="text"
                                                value={settings.payments?.razorpay?.keyId || ""}
                                                placeholder="rzp_test_xxxxxxxxxx"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                readOnly
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div>
                                                <p className="font-medium text-sm">Test Mode</p>
                                                <p className="text-xs text-gray-500">Using test credentials</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${settings.payments?.razorpay?.testMode
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-green-100 text-green-700"}`}>
                                                {settings.payments?.razorpay?.testMode ? "Test" : "Live"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stripe */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <span className="text-indigo-600 font-bold">S</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Stripe</p>
                                            <p className="text-sm text-gray-500">
                                                {settings.payments?.stripe?.enabled ? "Connected" : "Not connected"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Configure</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeSection === "security" && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Security Settings</h3>
                                <Button
                                    onClick={() => handleSave("security", settings.security || {})}
                                    disabled={saving}
                                    size="sm"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save
                                </Button>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Require 2FA for Admins</p>
                                        <p className="text-sm text-gray-500">Force two-factor authentication for admin accounts</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.security?.require2FAForAdmins ?? true}
                                            onChange={(e) => updateField("security", "require2FAForAdmins", e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Login Rate Limiting</p>
                                        <p className="text-sm text-gray-500">Limit login attempts to prevent brute force</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.security?.loginRateLimiting ?? true}
                                            onChange={(e) => updateField("security", "loginRateLimiting", e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Content Moderation</p>
                                        <p className="text-sm text-gray-500">Require approval for new products</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.security?.contentModeration ?? false}
                                            onChange={(e) => updateField("security", "contentModeration", e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeSection === "notifications" && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Notification Settings</h3>
                                <Button
                                    onClick={() => handleSave("notifications", settings.notifications || {})}
                                    disabled={saving}
                                    size="sm"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save
                                </Button>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">New Order Alerts</p>
                                        <p className="text-sm text-gray-500">Receive an email when a new order is placed</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.notifications?.emailOnNewOrder ?? true}
                                            onChange={(e) => updateField("notifications", "emailOnNewOrder", e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">New User Alerts</p>
                                        <p className="text-sm text-gray-500">Receive an email when a new user signs up</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.notifications?.emailOnNewUser ?? true}
                                            onChange={(e) => updateField("notifications", "emailOnNewUser", e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Payout Request Alerts</p>
                                        <p className="text-sm text-gray-500">Receive an email when a studio requests a payout</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.notifications?.emailOnPayout ?? true}
                                            onChange={(e) => updateField("notifications", "emailOnPayout", e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Settings */}
                    {activeSection === "email" && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Email Settings</h3>
                                <Button
                                    onClick={() => handleSave("email", settings.email || {})}
                                    disabled={saving}
                                    size="sm"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save
                                </Button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">SMTP Host</label>
                                    <input
                                        type="text"
                                        value={settings.email?.smtpHost || ""}
                                        onChange={(e) => updateField("email", "smtpHost", e.target.value)}
                                        placeholder="smtp.example.com"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">SMTP Port</label>
                                        <input
                                            type="number"
                                            value={settings.email?.smtpPort || 587}
                                            onChange={(e) => updateField("email", "smtpPort", parseInt(e.target.value))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Encryption</label>
                                        <select
                                            value={settings.email?.encryption || "tls"}
                                            onChange={(e) => updateField("email", "encryption", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        >
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                            <option value="none">None</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">From Email</label>
                                    <input
                                        type="email"
                                        value={settings.email?.fromEmail || ""}
                                        onChange={(e) => updateField("email", "fromEmail", e.target.value)}
                                        placeholder="noreply@corecreator.com"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                    />
                                </div>
                                <Button variant="outline" size="sm">
                                    Test Email Configuration
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Team Access Settings */}
                    {activeSection === "team" && (
                        <TeamAccessSettings />
                    )}

                    {/* Default fallback for other sections */}
                    {!["general", "email", "payments", "security", "notifications", "team"].includes(activeSection) && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold mb-6 capitalize">{activeSection} Settings</h3>
                            <p className="text-gray-500">Settings for this section are coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-component for Team Access (defined in same file for simplicity based on context)
function TeamAccessSettings() {
    const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [newAdmin, setNewAdmin] = React.useState({ name: "", email: "", password: "", adminRole: "content" });
    const [actionLoading, setActionLoading] = React.useState<string | null>(null);
    const [editingMember, setEditingMember] = React.useState<any | null>(null);

    React.useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const res = await fetch("/api/admin/team");
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data.teamMembers);
            }
        } catch (error) {
            console.error("Failed to fetch team:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading("add");
        try {
            const res = await fetch("/api/admin/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAdmin),
            });
            if (res.ok) {
                await fetchTeam();
                setShowAddModal(false);
                setNewAdmin({ name: "", email: "", password: "", adminRole: "content" });
            } else {
                const err = await res.json();
                alert(err.error || "Failed to add admin");
            }
        } catch (error) {
            console.error("Add admin error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;
        setActionLoading(editingMember._id);
        try {
            const res = await fetch(`/api/admin/team/${editingMember._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminRole: editingMember.adminRole }),
            });
            if (res.ok) {
                await fetchTeam();
                setEditingMember(null);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to update role");
            }
        } catch (error) {
            console.error("Update role error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevoke = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to revoke admin access for ${name}? They will be downgraded to a standard user.`)) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/team/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchTeam();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to revoke access");
            }
        } catch (error) {
            console.error("Revoke error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="p-6 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" /></div>;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold">Team Access Manager</h3>
                    <p className="text-gray-500 text-sm">Manage admin access and roles</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} size="sm">
                    <Users className="w-4 h-4 mr-2" /> Add Admin
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {teamMembers.map((member) => (
                            <tr key={member._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                            {member.name?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                        {member.adminRole || "admin"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {member.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditingMember(member)}
                                            className="text-gray-500 hover:text-purple-600 font-medium text-xs"
                                        >
                                            Edit Role
                                        </button>
                                        <button
                                            onClick={() => handleRevoke(member._id, member.name)}
                                            className="text-red-500 hover:text-red-700 font-medium text-xs"
                                            disabled={actionLoading === member._id}
                                        >
                                            {actionLoading === member._id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revoke"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {teamMembers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    No other admins found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Add New Admin</h3>
                        <form onSubmit={handleAddAdmin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={newAdmin.name}
                                    onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={newAdmin.email}
                                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={newAdmin.password}
                                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={newAdmin.adminRole}
                                    onChange={e => setNewAdmin({ ...newAdmin, adminRole: e.target.value })}
                                >
                                    <option value="super">Super Admin</option>
                                    <option value="operations">Operations</option>
                                    <option value="content">Content Manager</option>
                                    <option value="seo">SEO Specialist</option>
                                    <option value="finance">Finance Manager</option>
                                    <option value="support">Support Agent</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={actionLoading === "add"}>
                                    {actionLoading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Admin"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {editingMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-4">Edit Admin Role</h3>
                        <p className="text-sm text-gray-600 mb-4">Update role for {editingMember.name}</p>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    value={editingMember.adminRole || "content"}
                                    onChange={e => setEditingMember({ ...editingMember, adminRole: e.target.value })}
                                >
                                    <option value="super">Super Admin</option>
                                    <option value="operations">Operations</option>
                                    <option value="content">Content Manager</option>
                                    <option value="seo">SEO Specialist</option>
                                    <option value="finance">Finance Manager</option>
                                    <option value="support">Support Agent</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
                                <Button type="submit" disabled={actionLoading === editingMember._id}>
                                    {actionLoading === editingMember._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
