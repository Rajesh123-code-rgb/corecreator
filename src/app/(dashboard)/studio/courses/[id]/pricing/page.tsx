"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input } from "@/components/atoms";
import { Card , useToast } from "@/components/molecules";
import Link from "next/link";
import { ArrowLeft, Save, DollarSign, Percent } from "lucide-react";

export default function CoursePricingPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const courseId = params.id as string;

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const [formData, setFormData] = React.useState({
        price: "",
        compareAtPrice: "",
        currency: "USD",
    });

    React.useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/studio/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        price: data.price?.toString() || "",
                        compareAtPrice: data.compareAtPrice?.toString() || "",
                        currency: data.currency || "USD",
                    });
                }
            } catch (error) {
                console.error("Error fetching course:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`/api/studio/courses/${courseId}/pricing`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    price: parseFloat(formData.price),
                    compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
                    currency: formData.currency,
                }),
            });

            if (res.ok) {
                router.push("/studio/courses");
            } else {
                toast.error("Failed to update pricing");
            }
        } catch (error) {
            console.error("Error updating pricing:", error);
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const discount = formData.compareAtPrice && formData.price
        ? Math.round(((parseFloat(formData.compareAtPrice) - parseFloat(formData.price)) / parseFloat(formData.compareAtPrice)) * 100)
        : 0;

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
    }

    return (
        <div className="max-w-3xl">
            <div className="mb-6">
                <Link href="/studio/courses" className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Courses
                </Link>
                <h1 className="text-2xl font-bold">Edit Pricing</h1>
                <p className="text-[var(--muted-foreground)]">Set pricing, discounts, and payment options</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Course Pricing</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Regular Price *</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                <Input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                This is the price students will pay for your course
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Compare at Price (Optional)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                                <Input
                                    type="number"
                                    value={formData.compareAtPrice}
                                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="pl-10"
                                />
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                Original price before discount (shows strikethrough pricing)
                            </p>
                        </div>

                        {discount > 0 && (
                            <Card className="p-4 bg-green-50 border-green-200">
                                <div className="flex items-center gap-2 text-green-700">
                                    <Percent className="w-5 h-5" />
                                    <div>
                                        <p className="font-medium">{discount}% Discount</p>
                                        <p className="text-sm">
                                            Students save {formData.currency} {(parseFloat(formData.compareAtPrice) - parseFloat(formData.price)).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold mb-2">Pricing Preview</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                        This is how your pricing will appear to students
                    </p>

                    <div className="border border-[var(--border)] rounded-lg p-6 bg-[var(--muted)]/30">
                        <div className="flex items-baseline gap-2">
                            {formData.compareAtPrice && parseFloat(formData.compareAtPrice) > parseFloat(formData.price) && (
                                <span className="text-lg text-[var(--muted-foreground)] line-through">
                                    {formData.currency} {parseFloat(formData.compareAtPrice).toFixed(2)}
                                </span>
                            )}
                            <span className="text-3xl font-bold">
                                {formData.currency} {parseFloat(formData.price || "0").toFixed(2)}
                            </span>
                            {discount > 0 && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                                    {discount}% OFF
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={isSaving} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Pricing"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
