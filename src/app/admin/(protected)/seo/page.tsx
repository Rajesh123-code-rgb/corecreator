"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { useConfirmModal, useToast } from "@/components/molecules";
import {
    Globe,
    FileText,
    RefreshCw,
    Save,
    Loader2,
    ArrowRightLeft,
    CheckCircle,
    Search,
    Settings,
    Trash2
} from "lucide-react";

export default function SeoDashboardPage() {
    const [activeTab, setActiveTab] = React.useState("general");
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
    const [robotsContent, setRobotsContent] = React.useState("");
    const [generalSettings, setGeneralSettings] = React.useState({
        siteTitle: "",
        siteDescription: "",
        separator: "|",
        keywords: ""
    });
    const confirmModal = useConfirmModal();
    const toast = useToast();

    React.useEffect(() => {
        // Fetch current configuration
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/admin/seo/config");
                if (res.ok) {
                    const data = await res.json();
                    setRobotsContent(data.robotsTxt || "");
                    if (data.general) {
                        setGeneralSettings({
                            siteTitle: data.general.siteTitle || "",
                            siteDescription: data.general.siteDescription || "",
                            separator: data.general.separator || "|",
                            keywords: data.general.keywords || ""
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load SEO config", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSaveGeneral = async () => {
        setSaving(true);
        setStatus("idle");
        try {
            const res = await fetch("/api/admin/seo/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "general", content: generalSettings }),
            });
            if (res.ok) {
                setStatus("success");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRobots = async () => {
        setSaving(true);
        setStatus("idle");
        try {
            const res = await fetch("/api/admin/seo/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "robots", content: robotsContent }),
            });
            if (res.ok) {
                setStatus("success");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateSitemap = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/seo/sitemap", { method: "POST" });
            if (res.ok) {
                toast.success("Sitemap generation triggered successfully!");
            } else {
                toast.error("Failed to trigger sitemap generation");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    const [redirects, setRedirects] = React.useState<any[]>([]);
    const [newRedirect, setNewRedirect] = React.useState({ source: "", destination: "", permanent: true });

    const fetchRedirects = React.useCallback(async () => {
        try {
            const res = await fetch("/api/admin/seo/redirects");
            if (res.ok) {
                const data = await res.json();
                setRedirects(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch redirects", error);
        }
    }, []);

    React.useEffect(() => {
        if (activeTab === "redirects") {
            fetchRedirects();
        }
    }, [activeTab, fetchRedirects]);

    const handleAddRedirect = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/seo/redirects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRedirect),
            });
            if (res.ok) {
                await fetchRedirects();
                setNewRedirect({ source: "", destination: "", permanent: true });
                toast.success("Redirect added successfully!");
            } else {
                toast.error("Failed to add redirect");
            }
        } catch (error) {
            toast.error("Error adding redirect");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRedirect = async (id: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/seo/redirects?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchRedirects();
            } else {
                toast.error("Failed to delete redirect");
            }
        } catch (error) {
            toast.error("Error deleting redirect");
        } finally {
            setSaving(false);
        }
    };

    const handleSitemapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "text/xml" && !file.name.endsWith(".xml")) {
            toast.error("Please upload a valid .xml file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setSaving(true);
        try {
            const res = await fetch("/api/admin/seo/sitemap/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast.success("Sitemap uploaded successfully!");
                // Clear input
                e.target.value = "";
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to upload sitemap");
            }
        } catch (error) {
            toast.error("Upload failed");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
                <p className="text-gray-500 mt-1">Manage search engine visibility and configurations</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl border border-gray-100 p-2 space-y-1">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "general"
                                ? "bg-purple-50 text-purple-700"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            General Settings
                        </button>
                        <button
                            onClick={() => setActiveTab("robots")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "robots"
                                ? "bg-purple-50 text-purple-700"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Robots.txt
                        </button>
                        <button
                            onClick={() => setActiveTab("sitemap")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "sitemap"
                                ? "bg-purple-50 text-purple-700"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <Globe className="w-4 h-4" />
                            Sitemap
                        </button>
                        <button
                            onClick={() => setActiveTab("redirects")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "redirects"
                                ? "bg-purple-50 text-purple-700"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Redirects
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === "general" && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Global SEO Settings</h2>
                                <Button onClick={handleSaveGeneral} disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Title</label>
                                    <input
                                        type="text"
                                        value={generalSettings.siteTitle}
                                        onChange={(e) => setGeneralSettings(s => ({ ...s, siteTitle: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        placeholder="Core Creator - Global Art & Craft eLearning"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Default title for the homepage and suffix for other pages.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                    <textarea
                                        value={generalSettings.siteDescription}
                                        onChange={(e) => setGeneralSettings(s => ({ ...s, siteDescription: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        placeholder="The ultimate platform for artists, learners, and art lovers..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Recommended length: 150-160 characters.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title Separator</label>
                                    <input
                                        type="text"
                                        value={generalSettings.separator}
                                        onChange={(e) => setGeneralSettings(s => ({ ...s, separator: e.target.value }))}
                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        placeholder="-"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keywords</label>
                                    <textarea
                                        value={generalSettings.keywords}
                                        onChange={(e) => setGeneralSettings(s => ({ ...s, keywords: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                        placeholder="art, craft, learning, marketplace..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Comma-separated keywords.</p>
                                </div>
                            </div>

                            {status === "success" && (
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4" /> Saved successfully
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "robots" && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Robots.txt Editor</h2>
                                <Button onClick={handleSaveRobots} disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>
                            <p className="text-sm text-gray-500">
                                Configure which parts of your site should be crawled by search engines.
                            </p>
                            <div className="relative">
                                <textarea
                                    value={robotsContent}
                                    onChange={(e) => setRobotsContent(e.target.value)}
                                    className="w-full h-96 font-mono text-sm p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50"
                                    placeholder="User-agent: *"
                                />
                            </div>
                            {status === "success" && (
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4" /> Saved successfully
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "sitemap" && (
                        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
                            <h2 className="text-lg font-semibold">Sitemap Settings</h2>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-blue-900">Sitemap Status</h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Your sitemap is available at <a href="/sitemap.xml" target="_blank" className="underline">/sitemap.xml</a>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-medium mb-4">Manual Regeneration</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Trigger a manual regeneration of the sitemap. This is usually automated daily, but you can force an update if you've made significant content changes.
                                </p>
                                <Button variant="outline" onClick={handleGenerateSitemap} disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Regenerate Sitemap Now
                                </Button>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-medium mb-4">Manual Upload</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Upload a custom <code>sitemap.xml</code> file directly. This will overwrite the automatically generated sitemap.
                                </p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept=".xml"
                                        onChange={handleSitemapUpload}
                                        disabled={saving}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-purple-50 file:text-purple-700
                                            hover:file:bg-purple-100
                                        "
                                    />
                                    {saving && <Loader2 className="w-5 h-5 animate-spin text-purple-600" />}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "redirects" && (
                        <div className="space-y-6">
                            {/* Add Redirect Form */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold mb-4">Add New Redirect</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                                        <input
                                            type="text"
                                            value={newRedirect.source}
                                            onChange={(e) => setNewRedirect(s => ({ ...s, source: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            placeholder="/old-page"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
                                        <input
                                            type="text"
                                            value={newRedirect.destination}
                                            onChange={(e) => setNewRedirect(s => ({ ...s, destination: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                            placeholder="/new-page"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="permanent"
                                            checked={newRedirect.permanent}
                                            onChange={(e) => setNewRedirect(s => ({ ...s, permanent: e.target.checked }))}
                                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                        />
                                        <label htmlFor="permanent" className="text-sm text-gray-700">Permanent (301)</label>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleAddRedirect} disabled={saving || !newRedirect.source || !newRedirect.destination}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Add Redirect Rule
                                    </Button>
                                </div>
                            </div>

                            {/* Redirects List */}
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">Active Redirects</h2>
                                    <span className="text-sm text-gray-500">{redirects.length} rules</span>
                                </div>
                                {redirects.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>No redirects configured yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 font-medium text-gray-500">Source</th>
                                                <th className="px-6 py-3 font-medium text-gray-500">Destination</th>
                                                <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                                                <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {redirects.map((redirect) => (
                                                <tr key={redirect.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-mono text-gray-600">{redirect.source}</td>
                                                    <td className="px-6 py-4 font-mono text-gray-600">{redirect.destination}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${redirect.permanent ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                            {redirect.permanent ? "301 Permanent" : "302 Temporary"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => confirmModal.confirm({
                                                                title: "Delete Redirect",
                                                                message: "Delete this redirect rule? This action cannot be undone.",
                                                                confirmText: "Delete",
                                                                onConfirm: () => handleDeleteRedirect(redirect.id),
                                                            })}
                                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            disabled={saving}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
