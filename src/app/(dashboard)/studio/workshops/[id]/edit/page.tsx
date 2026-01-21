"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button, Input } from "@/components/atoms";
import { Card, ThumbnailUploader } from "@/components/molecules";
import { useConfirmModal } from "@/components/molecules";
import {
    Calendar,
    Clock,
    Users,
    Video,
    Save,
    Plus,
    X,
    Loader2,
    AlertCircle,
    Trash2,
    Eye,
    ArrowLeft,
    CheckCircle,
    Send,
    AlertTriangle,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";



const LEVELS = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "all", label: "All Levels" },
];

const CURRENCIES = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
];

export default function EditWorkshopPage() {
    const router = useRouter();
    const params = useParams();
    const workshopId = params.id as string;
    const { formatPrice } = useCurrency();

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [isSubmittingForReview, setIsSubmittingForReview] = React.useState(false);
    const [workshop, setWorkshop] = React.useState<any>(null);
    const [activeTab, setActiveTab] = React.useState("details");
    const [workshopCategories, setWorkshopCategories] = React.useState<{ _id: string; name: string; slug: string }[]>([]);
    const confirmModal = useConfirmModal();

    // Fetch categories from database
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories?type=workshop");
                if (res.ok) {
                    const data = await res.json();
                    setWorkshopCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const [formData, setFormData] = React.useState({
        title: "",
        description: "",
        date: "",
        time: "",
        duration: "60",
        capacity: "20",
        price: "",
        currency: "INR",
        meetingUrl: "",
        category: "",
        level: "all",
        thumbnail: "",
        requirements: [] as string[],
        agenda: [] as string[],
        status: "draft",
    });

    const [newRequirement, setNewRequirement] = React.useState("");
    const [newAgendaItem, setNewAgendaItem] = React.useState("");

    // Fetch workshop data
    React.useEffect(() => {
        const fetchWorkshop = async () => {
            try {
                const res = await fetch(`/api/studio/workshops/${workshopId}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch workshop");
                }

                const workshop = data.workshop;
                setWorkshop(workshop);
                const workshopDate = new Date(workshop.date);

                setFormData({
                    title: workshop.title || "",
                    description: workshop.description || "",
                    date: workshopDate.toISOString().split("T")[0],
                    time: workshopDate.toTimeString().slice(0, 5),
                    duration: workshop.duration?.toString() || "60",
                    capacity: workshop.capacity?.toString() || "20",
                    price: workshop.price?.toString() || "",
                    currency: workshop.currency || "INR",
                    meetingUrl: workshop.meetingUrl || "",
                    category: workshop.category || "",
                    level: workshop.level || "all",
                    thumbnail: workshop.thumbnail || "",
                    requirements: workshop.requirements || [],
                    agenda: workshop.agenda || [],
                    status: workshop.status || "draft",
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load workshop");
            } finally {
                setIsLoading(false);
            }
        };

        if (workshopId) {
            fetchWorkshop();
        }
    }, [workshopId]);

    const handleAddRequirement = () => {
        if (newRequirement.trim()) {
            setFormData(prev => ({
                ...prev,
                requirements: [...prev.requirements, newRequirement.trim()]
            }));
            setNewRequirement("");
        }
    };

    const handleRemoveRequirement = (index: number) => {
        setFormData(prev => ({
            ...prev,
            requirements: prev.requirements.filter((_, i) => i !== index)
        }));
    };

    const handleAddAgendaItem = () => {
        if (newAgendaItem.trim()) {
            setFormData(prev => ({
                ...prev,
                agenda: [...prev.agenda, newAgendaItem.trim()]
            }));
            setNewAgendaItem("");
        }
    };

    const handleRemoveAgendaItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            agenda: prev.agenda.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);

            const res = await fetch(`/api/studio/workshops/${workshopId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    date: dateTime.toISOString(),
                    duration: parseInt(formData.duration),
                    capacity: parseInt(formData.capacity),
                    price: parseFloat(formData.price) || 0,
                    currency: formData.currency,
                    meetingUrl: formData.meetingUrl,
                    category: formData.category,
                    level: formData.level,
                    thumbnail: formData.thumbnail,
                    requirements: formData.requirements,
                    agenda: formData.agenda,
                    status: formData.status,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update workshop");
            }

            setSuccess("Workshop saved successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save workshop");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        const newStatus = formData.status === "upcoming" ? "draft" : "upcoming";
        setFormData(prev => ({ ...prev, status: newStatus }));

        setIsSaving(true);
        try {
            const res = await fetch(`/api/studio/workshops/${workshopId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                throw new Error("Failed to update status");
            }

            setSuccess(newStatus === "upcoming" ? "Workshop published!" : "Workshop unpublished");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update status");
            setFormData(prev => ({ ...prev, status: formData.status }));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitForReview = async () => {
        if (!confirm("Submit this workshop for admin review? You can still edit while it's being reviewed.")) return;
        setIsSubmittingForReview(true);
        try {
            const res = await fetch(`/api/studio/workshops/${workshopId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "pending" }),
            });
            if (res.ok) {
                const data = await res.json();
                setWorkshop(data.workshop);
                setFormData(prev => ({ ...prev, status: "pending" }));
                setSuccess("Workshop submitted for review!");
                setTimeout(() => setSuccess(null), 3000);
            } else {
                const err = await res.json();
                setError(err.error || "Failed to submit for review");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit for review");
        } finally {
            setIsSubmittingForReview(false);
        }
    };

    const handleDelete = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/studio/workshops/${workshopId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete workshop");
            }

            router.push("/studio/workshops");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete workshop");
            setIsSaving(false);
        }
    };

    const getCurrencySymbol = () => {
        return CURRENCIES.find(c => c.code === formData.currency)?.symbol || "₹";
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
            </div>
        );
    }

    const tabs = [
        { id: "details", label: "Details" },
        { id: "content", label: "Content" },
        { id: "settings", label: "Settings" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/studio/workshops" className="p-2 hover:bg-[var(--muted)] rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{formData.title || "Edit Workshop"}</h1>
                        <p className="text-[var(--muted-foreground)]">
                            {formData.status === "upcoming" ? (
                                <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Published
                                </span>
                            ) : (
                                <span className="text-gray-500">Draft</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {(formData.status === "draft" || formData.status === "rejected") && (
                        <Button onClick={handleSubmitForReview} disabled={isSubmittingForReview} className="bg-orange-500 hover:bg-orange-600">
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmittingForReview ? "Submitting..." : "Submit for Review"}
                        </Button>
                    )}
                    {formData.status === "pending" && (
                        <span className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-medium flex items-center">Pending Review</span>
                    )}
                    {formData.status === "upcoming" && (
                        <Button variant="outline" onClick={handlePublish} disabled={isSaving}>
                            <Eye className="w-4 h-4 mr-2" />
                            Unpublish
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Rejection Feedback */}
            {workshop?.status === "rejected" && workshop?.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-red-700">Your workshop was rejected</h4>
                        <p className="text-sm text-red-600 mt-1">{workshop.rejectionReason}</p>
                        <p className="text-xs text-red-500 mt-2">Please address the feedback and resubmit for review.</p>
                    </div>
                </div>
            )}

            {/* Alerts */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{success}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[var(--border)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? "border-[var(--secondary-600)] text-[var(--secondary-600)]"
                            : "border-transparent hover:text-[var(--secondary-600)]"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 space-y-6">
                            <h2 className="font-semibold text-lg border-b border-[var(--border)] pb-4">Workshop Details</h2>

                            <Input
                                label="Workshop Title"
                                placeholder="e.g. Live Watercolor Q&A"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full min-h-[150px] p-3 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    placeholder="What will you cover?"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {workshopCategories.map((cat) => (
                                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Skill Level</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    >
                                        {LEVELS.map((level) => (
                                            <option key={level.value} value={level.value}>{level.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                        <input
                                            type="date"
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)]"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                        <input
                                            type="time"
                                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)]"
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Duration</label>
                                    <select
                                        className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    >
                                        <option value="30">30 minutes</option>
                                        <option value="45">45 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="90">1.5 hours</option>
                                        <option value="120">2 hours</option>
                                        <option value="180">3 hours</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Capacity</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                        <Input
                                            type="number"
                                            min="1"
                                            className="pl-9"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6 space-y-4">
                            <h2 className="font-semibold mb-2">Thumbnail</h2>
                            <ThumbnailUploader
                                onUploadComplete={(data) => setFormData({ ...formData, thumbnail: data.url })}
                                existingImage={formData.thumbnail ? { url: formData.thumbnail, filename: "thumbnail" } : undefined}
                            />
                        </Card>

                        <Card className="p-6 space-y-6">
                            <h2 className="font-semibold border-b border-[var(--border)] pb-4">Pricing</h2>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Currency</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CURRENCIES.map((curr) => (
                                        <button
                                            key={curr.code}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, currency: curr.code })}
                                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${formData.currency === curr.code
                                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <span className="text-lg font-bold">{curr.symbol}</span>
                                            <span className="text-sm">{curr.code}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Price ({getCurrencySymbol()})</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">{getCurrencySymbol()}</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="pl-8"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === "content" && (
                <div className="space-y-6">
                    <Card className="p-6 space-y-6">
                        <h2 className="font-semibold text-lg border-b border-[var(--border)] pb-4">Requirements</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">What should attendees prepare?</p>

                        <div className="space-y-3">
                            {formData.requirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-[var(--muted)] rounded-lg">
                                    <span className="flex-1 text-sm">{req}</span>
                                    <button onClick={() => handleRemoveRequirement(index)} className="p-1 hover:bg-red-100 rounded text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Watercolor paints, brushes"
                                    value={newRequirement}
                                    onChange={(e) => setNewRequirement(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
                                />
                                <Button type="button" variant="outline" onClick={handleAddRequirement}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <h2 className="font-semibold text-lg border-b border-[var(--border)] pb-4">Agenda</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">Topics you'll cover</p>

                        <div className="space-y-3">
                            {formData.agenda.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-[var(--muted)] rounded-lg">
                                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--secondary-500)] text-white rounded-full text-xs font-bold">{index + 1}</span>
                                    <span className="flex-1 text-sm">{item}</span>
                                    <button onClick={() => handleRemoveAgendaItem(index)} className="p-1 hover:bg-red-100 rounded text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Introduction to color theory"
                                    value={newAgendaItem}
                                    onChange={(e) => setNewAgendaItem(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAgendaItem())}
                                />
                                <Button type="button" variant="outline" onClick={handleAddAgendaItem}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <h2 className="font-semibold text-lg border-b border-[var(--border)] pb-4">Virtual Classroom</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meeting URL</label>
                            <div className="relative">
                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                <Input
                                    className="pl-9"
                                    placeholder="Zoom / Google Meet Link"
                                    value={formData.meetingUrl}
                                    onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)]">We'll email this link to registered students 1 hour before the session.</p>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "settings" && (
                <div className="space-y-6">
                    <Card className="p-6 space-y-6">
                        <h2 className="font-semibold text-lg border-b border-[var(--border)] pb-4">Workshop Status</h2>
                        <div className="flex items-center justify-between p-4 bg-[var(--muted)] rounded-lg">
                            <div>
                                <p className="font-medium">
                                    {formData.status === "upcoming" ? "Workshop is Live" : "Workshop is Draft"}
                                </p>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    {formData.status === "upcoming"
                                        ? "Students can register for this workshop"
                                        : "Only you can see this workshop"}
                                </p>
                            </div>
                            <Button variant={formData.status === "upcoming" ? "outline" : "default"} onClick={handlePublish}>
                                {formData.status === "upcoming" ? "Unpublish" : "Publish"}
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6 border-red-200">
                        <h2 className="font-semibold text-lg text-red-600 border-b border-red-200 pb-4">Danger Zone</h2>
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                            <div>
                                <p className="font-medium text-red-600">Delete Workshop</p>
                                <p className="text-sm text-red-500">This action cannot be undone</p>
                            </div>
                            <Button
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => confirmModal.confirm({
                                    title: "Delete Workshop",
                                    message: "Are you sure you want to delete this workshop? This action cannot be undone.",
                                    confirmText: "Delete",
                                    onConfirm: handleDelete,
                                })}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            {confirmModal.ConfirmModalElement}
        </div>
    );
}
