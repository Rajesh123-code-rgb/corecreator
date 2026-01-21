"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import {
    ToggleLeft,
    ToggleRight,
    Server,
    ShieldAlert,
    Save,
    Loader2,
    CheckCircle,
    Info
} from "lucide-react";

export default function SystemSettingsPage() {
    const [configs, setConfigs] = React.useState<Record<string, boolean>>({
        maintenance_mode: false,
        beta_features: false,
        user_registration: true,
        studio_approvals: true,
    });
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");

    React.useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/admin/system/config");
            if (res.ok) {
                const data = await res.json();
                // Map array of configs to object
                const configMap: Record<string, boolean> = {};
                data.configs.forEach((c: any) => configMap[c.key] = c.value);
                setConfigs(prev => ({ ...prev, ...configMap }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: string) => {
        const newValue = !configs[key];
        setConfigs(prev => ({ ...prev, [key]: newValue }));

        // Auto-save on toggle
        try {
            const res = await fetch("/api/admin/system/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value: newValue }),
            });
            if (!res.ok) {
                // Revert on failure
                setConfigs(prev => ({ ...prev, [key]: !newValue }));
                alert("Failed to update setting");
            }
        } catch (error) {
            setConfigs(prev => ({ ...prev, [key]: !newValue }));
            alert("Network error");
        }
    };

    if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
                <p className="text-gray-500 mt-1">Manage platform-wide feature flags and operational modes</p>
            </div>

            <div className="grid gap-6">
                {/* Operational Modes */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Operational Zones</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Maintenance Mode</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Disables access for all non-admin users. Show maintenance page.
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle("maintenance_mode")}
                                className={`text-2xl transition-colors ${configs.maintenance_mode ? "text-purple-600" : "text-gray-300"}`}
                            >
                                {configs.maintenance_mode ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">User Registration</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Allow new users to sign up. Turn off to pause growth.
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle("user_registration")}
                                className={`text-2xl transition-colors ${configs.user_registration ? "text-purple-600" : "text-gray-300"}`}
                            >
                                {configs.user_registration ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Feature Flags */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Server className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Beta Features</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Enable experimental features for users opted into beta program.
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle("beta_features")}
                                className={`text-2xl transition-colors ${configs.beta_features ? "text-purple-600" : "text-gray-300"}`}
                            >
                                {configs.beta_features ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div>
                                <p className="font-medium text-gray-900">Auto-Approve Studios</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Automatically approve new studio applications without manual review.
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle("studio_approvals")}
                                className={`text-2xl transition-colors ${configs.studio_approvals ? "text-purple-600" : "text-gray-300"}`}
                            >
                                {configs.studio_approvals ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Environment Info */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Environment Variables (Safe View)</h3>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
                        <p>NODE_ENV: {process.env.NODE_ENV}</p>
                        <p>NEXT_PUBLIC_SITE_URL: {process.env.NEXT_PUBLIC_SITE_URL}</p>
                        <p>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
