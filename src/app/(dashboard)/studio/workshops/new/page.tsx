"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/atoms";
import { Card, ThumbnailUploader } from "@/components/molecules";
import {
    Calendar,
    Clock,
    Users,
    Video,
    DollarSign,
    Save,
    Plus,
    X,
    Loader2,
    AlertCircle,
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

export default function NewWorkshopPage() {
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [workshopCategories, setWorkshopCategories] = React.useState<{ _id: string; name: string; slug: string }[]>([]);

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

    // Check KYC Status
    React.useEffect(() => {
        const checkStatus = async () => {
            const res = await fetch("/api/studio/verification/status");
            if (res.ok) {
                const data = await res.json();
                if (data.status !== "approved") {
                    router.replace("/studio/verification");
                }
            }
        };
        checkStatus();
    }, [router]);

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
    });

    const [newRequirement, setNewRequirement] = React.useState("");
    const [newAgendaItem, setNewAgendaItem] = React.useState("");

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Combine date and time
            const dateTime = new Date(`${formData.date}T${formData.time}`);

            const res = await fetch("/api/studio/workshops", {
                method: "POST",
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
                    status: "draft",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create workshop");
            }

            router.push(`/studio/workshops/${data.workshop.id}/edit`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create workshop");
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrencySymbol = () => {
        return CURRENCIES.find(c => c.code === formData.currency)?.symbol || "₹";
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Schedule New Workshop</h1>
                    <p className="text-[var(--muted-foreground)]">Create a live interactive session</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/studio/workshops">Cancel</Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !formData.title || !formData.category || !formData.thumbnail}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Create Workshop
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Form */}
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
                                placeholder="What will you cover in this workshop?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category *</label>
                                <select
                                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
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
                                        required
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
                                        required
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
                                        placeholder="20"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <h2 className="font-semibold text-lg border-b border-[var(--border)] pb-4">Requirements</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">What should attendees prepare before the workshop?</p>

                        <div className="space-y-3">
                            {formData.requirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-[var(--muted)] rounded-lg">
                                    <span className="flex-1 text-sm">{req}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRequirement(index)}
                                        className="p-1 hover:bg-red-100 rounded text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Watercolor paints, brushes, paper"
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
                        <p className="text-sm text-[var(--muted-foreground)]">What topics will you cover during the workshop?</p>

                        <div className="space-y-3">
                            {formData.agenda.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-[var(--muted)] rounded-lg">
                                    <span className="w-6 h-6 flex items-center justify-center bg-[var(--secondary-500)] text-white rounded-full text-xs font-bold">{index + 1}</span>
                                    <span className="flex-1 text-sm">{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAgendaItem(index)}
                                        className="p-1 hover:bg-red-100 rounded text-red-500"
                                    >
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

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6 space-y-6">
                        <h2 className="font-semibold text-lg border-b border-[var(--border)] pb-4">Pricing</h2>

                        {/* Currency Selector */}
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
                            <p className="text-xs text-[var(--muted-foreground)]">Set to 0 for free workshops.</p>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h2 className="font-semibold mb-2">Thumbnail *</h2>
                        <ThumbnailUploader
                            onUploadComplete={(data) => setFormData({ ...formData, thumbnail: data.url })}
                            existingImage={formData.thumbnail ? { url: formData.thumbnail, filename: "thumbnail" } : undefined}
                        />
                    </Card>

                    {/* Preview Card */}
                    {formData.title && (
                        <Card className="p-4 space-y-3">
                            <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Preview</h3>
                            {formData.thumbnail && (
                                <img src={formData.thumbnail} alt="Preview" className="w-full aspect-video object-cover rounded-lg" />
                            )}
                            <h4 className="font-semibold">{formData.title}</h4>
                            {formData.date && formData.time && (
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    {new Date(`${formData.date}T${formData.time}`).toLocaleString()}
                                </p>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--muted-foreground)]">{formData.duration} min • {formData.capacity} spots</span>
                                <span className="font-bold text-[var(--secondary-600)]">
                                    {formData.price ? `${getCurrencySymbol()}${formData.price}` : "Free"}
                                </span>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

