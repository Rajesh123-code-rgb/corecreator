"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input } from "@/components/atoms";
import { Card, ThumbnailUploader, VideoUploader, ProgressChecklist, PreviewButton , useToast } from "@/components/molecules";
import Link from "next/link";
import { ArrowLeft, Save, X, Plus, Send, AlertTriangle } from "lucide-react";

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const courseId = params.id as string;

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [course, setCourse] = React.useState<any>(null);
    const [courseCategories, setCourseCategories] = React.useState<{ _id: string; name: string; slug: string }[]>([]);
    const [isSubmittingForReview, setIsSubmittingForReview] = React.useState(false);

    // Fetch categories from database
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories?type=course");
                if (res.ok) {
                    const data = await res.json();
                    setCourseCategories(data.categories || []);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const [formData, setFormData] = React.useState({
        title: "",
        subtitle: "",
        description: "",
        category: "",
        level: "",
        price: "",
        currency: "USD",
        thumbnail: "",
        promoVideo: "",
        learningOutcomes: ["", "", ""],
        targetAudience: [""],
        prerequisites: [""],
        sections: [] as any[],
    });

    React.useEffect(() => {
        // Fetch course data
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/studio/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("Fetched course data:", data);
                    console.log("Type of learningOutcomes:", typeof data.learningOutcomes);
                    console.log("Is array:", Array.isArray(data.learningOutcomes));
                    console.log("Full object keys:", Object.keys(data));

                    setCourse(data);
                    setFormData({
                        title: data.title || "",
                        subtitle: data.subtitle || "",
                        description: data.description || "",
                        category: data.category || "",
                        level: data.level || "",
                        price: data.price?.toString() || "",
                        currency: data.currency || "USD",
                        thumbnail: data.thumbnail || "",
                        promoVideo: data.promoVideo || "",
                        learningOutcomes: (data.learningOutcomes && data.learningOutcomes.length > 0)
                            ? data.learningOutcomes
                            : ["", "", ""],
                        targetAudience: (data.targetAudience && data.targetAudience.length > 0)
                            ? data.targetAudience
                            : [""],
                        prerequisites: (data.prerequisites && data.prerequisites.length > 0)
                            ? data.prerequisites
                            : [""],
                        sections: data.sections || [],
                    });

                    console.log("Learning outcomes from API:", data.learningOutcomes);
                } else {
                    console.error("Failed to fetch course, status:", res.status);
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

    // Learning Outcomes helpers
    const addLearningOutcome = () => {
        setFormData({ ...formData, learningOutcomes: [...formData.learningOutcomes, ""] });
    };

    const removeLearningOutcome = (index: number) => {
        if (formData.learningOutcomes.length > 3) {
            setFormData({ ...formData, learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== index) });
        }
    };

    const updateLearningOutcome = (index: number, value: string) => {
        const newOutcomes = [...formData.learningOutcomes];
        newOutcomes[index] = value;
        setFormData({ ...formData, learningOutcomes: newOutcomes });
    };

    // Target Audience helpers
    const addTargetAudience = () => {
        setFormData({ ...formData, targetAudience: [...formData.targetAudience, ""] });
    };

    const removeTargetAudience = (index: number) => {
        setFormData({ ...formData, targetAudience: formData.targetAudience.filter((_, i) => i !== index) });
    };

    const updateTargetAudience = (index: number, value: string) => {
        const newAudience = [...formData.targetAudience];
        newAudience[index] = value;
        setFormData({ ...formData, targetAudience: newAudience });
    };

    // Prerequisites helpers
    const addPrerequisite = () => {
        setFormData({ ...formData, prerequisites: [...formData.prerequisites, ""] });
    };

    const removePrerequisite = (index: number) => {
        setFormData({ ...formData, prerequisites: formData.prerequisites.filter((_, i) => i !== index) });
    };

    const updatePrerequisite = (index: number, value: string) => {
        const newPrerequisites = [...formData.prerequisites];
        newPrerequisites[index] = value;
        setFormData({ ...formData, prerequisites: newPrerequisites });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Filter out empty values
            const filteredData = {
                ...formData,
                learningOutcomes: formData.learningOutcomes.filter(o => o.trim() !== ""),
                targetAudience: formData.targetAudience.filter(a => a.trim() !== ""),
                prerequisites: formData.prerequisites.filter(p => p.trim() !== ""),
            };

            console.log("Submitting course update with data:", {
                learningOutcomesCount: filteredData.learningOutcomes.length,
                learningOutcomes: filteredData.learningOutcomes,
                targetAudienceCount: filteredData.targetAudience.length,
                prerequisitesCount: filteredData.prerequisites.length,
            });

            const res = await fetch(`/api/studio/courses/${courseId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(filteredData),
            });

            if (res.ok) {
                const updated = await res.json();
                console.log("Course updated successfully:", {
                    learningOutcomes: updated.learningOutcomes,
                });
                router.push("/studio/courses");
            } else {
                toast.error("Failed to update course");
            }
        } catch (error) {
            console.error("Error updating course:", error);
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitForReview = async () => {
        if (!confirm("Submit this course for admin review? You can still edit while it's being reviewed.")) return;
        setIsSubmittingForReview(true);
        try {
            const res = await fetch(`/api/studio/courses/${courseId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "pending" }),
            });
            if (res.ok) {
                const updated = await res.json();
                setCourse(updated);
                toast.success("Course submitted for review!");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to submit for review");
            }
        } catch (error) {
            console.error("Error submitting for review:", error);
            toast.error("An error occurred");
        } finally {
            setIsSubmittingForReview(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-[var(--muted-foreground)]">Loading...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-[var(--muted-foreground)]">Course not found</p>
            </div>
        );
    }

    return (
        <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
                <div className="mb-6">
                    <Link href="/studio/courses" className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Courses
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Edit Course</h1>
                            <p className="text-[var(--muted-foreground)]">Update your course details</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <PreviewButton formData={formData} />
                            {(course?.status === "draft" || course?.status === "rejected") && (
                                <Button type="button" onClick={handleSubmitForReview} disabled={isSubmittingForReview} className="bg-orange-500 hover:bg-orange-600 text-white">
                                    <Send className="w-4 h-4 mr-2" />
                                    {isSubmittingForReview ? "Submitting..." : "Submit for Review"}
                                </Button>
                            )}
                            {course?.status === "pending" && (
                                <span className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-medium">Pending Review</span>
                            )}
                            {course?.status === "published" && (
                                <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium">Published</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rejection Feedback */}
                {course?.status === "rejected" && course?.rejectionReason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-red-700">Your course was rejected</h4>
                            <p className="text-sm text-red-600 mt-1">{course.rejectionReason}</p>
                            <p className="text-xs text-red-500 mt-2">Please address the feedback and resubmit for review.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Course Title *</label>
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Watercolor Painting Masterclass"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Subtitle</label>
                                <Input
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="A brief description of your course"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed course description..."
                                    rows={5}
                                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Category *</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    >
                                        <option value="">Select Category</option>
                                        {courseCategories.map((cat) => (
                                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Level</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="all">All Levels</option>
                                    </select>
                                </div>
                            </div>

                            {/* Learning Outcomes */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    What students will learn * <span className="text-xs text-[var(--muted-foreground)]">(Min. 3)</span>
                                </label>
                                <div className="space-y-2">
                                    {formData.learningOutcomes.map((outcome, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                required
                                                value={outcome}
                                                onChange={(e) => updateLearningOutcome(index, e.target.value)}
                                                placeholder={`Learning outcome ${index + 1}`}
                                            />
                                            {formData.learningOutcomes.length > 3 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeLearningOutcome(index)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addLearningOutcome}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Learning Outcome
                                    </Button>
                                </div>
                            </div>

                            {/* Target Audience */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Target Audience (Optional)</label>
                                <div className="space-y-2">
                                    {formData.targetAudience.map((audience, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={audience}
                                                onChange={(e) => updateTargetAudience(index, e.target.value)}
                                                placeholder={`Target audience ${index + 1}`}
                                            />
                                            {formData.targetAudience.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeTargetAudience(index)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addTargetAudience}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Target Audience
                                    </Button>
                                </div>
                            </div>

                            {/* Prerequisites */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Prerequisites (Optional)</label>
                                <div className="space-y-2">
                                    {formData.prerequisites.map((prereq, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={prereq}
                                                onChange={(e) => updatePrerequisite(index, e.target.value)}
                                                placeholder={`Prerequisite ${index + 1}`}
                                            />
                                            {formData.prerequisites.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removePrerequisite(index)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addPrerequisite}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Prerequisite
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Media */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Course Media</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Course Thumbnail *</label>
                                <ThumbnailUploader
                                    onUploadComplete={(imageData) => setFormData({ ...formData, thumbnail: imageData.url })}
                                    existingImage={formData.thumbnail ? { url: formData.thumbnail, filename: '' } : undefined}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Promo Video (Optional)</label>
                                <VideoUploader
                                    onUploadComplete={(videoData) => setFormData({ ...formData, promoVideo: videoData.url })}
                                    existingVideo={formData.promoVideo ? { url: formData.promoVideo, duration: 0, filename: '' } : undefined}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Pricing */}
                    <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Pricing</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Price *</label>
                                <Input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                >
                                    <option value="USD">USD</option>
                                    <option value="INR">INR</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button type="submit" disabled={isSaving} className="flex-1">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancel
                        </Button>
                    </div>
                </form>

                {/* Additional Actions */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">Edit Curriculum</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mb-4">
                            Manage sections, lessons, and content types
                        </p>
                        <Link href={`/studio/courses/${courseId}/curriculum`}>
                            <Button variant="outline" className="w-full">
                                Edit Curriculum →
                            </Button>
                        </Link>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">Pricing Options</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mb-4">
                            Set pricing, discounts, and payment options
                        </p>
                        <Link href={`/studio/courses/${courseId}/pricing`}>
                            <Button variant="outline" className="w-full">
                                Edit Pricing →
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>

            {/* Sidebar - Progress Checklist */}
            <div className="w-80 flex-shrink-0 sticky top-24 self-start">
                <ProgressChecklist courseData={formData} />
            </div>
        </div>
    );
}
