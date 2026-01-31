"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button, Input } from "@/components/atoms";
import { Card, VideoUploader, ThumbnailUploader, ArticleLectureEditor, ResourceLectureUploader, ProjectLectureEditor, ProgressChecklist, PreviewButton , useToast } from "@/components/molecules";
import { createCourse } from "../actions";
import {
    BookOpen,
    LayoutList,
    Video,
    DollarSign,
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    Upload,
    Image as ImageIcon,
    Save,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    GripVertical,
    Send,
} from "lucide-react";

interface LessonData {
    title: string;
    type: "video" | "article" | "resource" | "project";
    videoUrl?: string;
    videoDuration?: number;
    videoFilename?: string;
    articleContent?: string;
    resourceFiles?: Array<{
        url: string;
        type: string;
        name: string;
        size?: number;
    }>;
    projectContent?: {
        instructions: string;
        expectedOutcome: string;
        referenceImages: string[];
    };
}

const steps = [
    { id: "basics", label: "Basic Info", icon: BookOpen },
    { id: "curriculum", label: "Curriculum", icon: LayoutList },
    { id: "media", label: "Media", icon: Video },
    { id: "pricing", label: "Pricing", icon: DollarSign },
];

export default function NewCoursePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const toast = useToast();
    const [currentStep, setCurrentStep] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const [courseCategories, setCourseCategories] = React.useState<{ _id: string; name: string; slug: string }[]>([]);

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

    // Form State
    const [formData, setFormData] = React.useState<{
        title: string;
        subtitle: string;
        description: string;
        category: string;
        level: string;
        price: string;
        currency: string;
        thumbnail: string;
        promoVideo: string;
        learningOutcomes: string[];
        targetAudience: string[];
        prerequisites: string[];
        sections: Array<{
            title: string;
            lessons: LessonData[];
        }>;
    }>({
        title: "",
        subtitle: "",
        description: "",
        category: "",
        level: "all",
        price: "",
        currency: "USD",
        thumbnail: "",
        promoVideo: "",
        learningOutcomes: [""],
        targetAudience: [""],
        prerequisites: [""],
        sections: [
            {
                title: "Introduction",
                lessons: [{ title: "Welcome to the course", type: "video", videoUrl: "", videoDuration: 0, videoFilename: "" }]
            }
        ]
    });
    const [expandedLesson, setExpandedLesson] = React.useState<{ section: number, lesson: number } | null>(null);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            // Validation
            const errors: string[] = [];

            // Title validation (10-60 characters)
            if (!formData.title || formData.title.trim().length < 10) {
                errors.push("Course title must be at least 10 characters long");
            }
            if (formData.title && formData.title.trim().length > 60) {
                errors.push("Course title must not exceed 60 characters");
            }

            // Learning outcomes validation (minimum 3 non-empty)
            const validOutcomes = formData.learningOutcomes.filter(o => o.trim() !== "");
            if (validOutcomes.length < 3) {
                errors.push("Please provide at least 3 learning outcomes");
            }

            // Minimum lectures validation (at least 2 lectures total)
            const totalLectures = formData.sections.reduce((sum, section) => sum + section.lessons.length, 0);
            if (totalLectures < 2) {
                errors.push("Course must have at least 2 lectures");
            }

            // Required fields validation
            if (!formData.description || formData.description.trim().length === 0) {
                errors.push("Course description is required");
            }
            if (!formData.category) {
                errors.push("Please select a category");
            }
            if (!formData.price || parseFloat(formData.price) < 0) {
                errors.push("Please set a valid price");
            }

            // Show errors if any
            if (errors.length > 0) {
                toast.error("Please fix the following errors:\n\n" + errors.join("\n"));
                setIsLoading(false);
                return;
            }

            // Call server action to create course
            console.log("Submitting course with data:", {
                title: formData.title,
                sectionsCount: formData.sections.length,
                learningOutcomesCount: formData.learningOutcomes.length,
                hasDescription: !!formData.description,
                hasCategory: !!formData.category,
                price: formData.price
            });

            const result = await createCourse({
                ...formData,
                status: "draft"
            });

            console.log("Server response:", result);

            if (result.success) {
                router.push("/studio/courses");
            } else {
                console.error("Course creation failed:", result.error);
                toast.error(result.error || "Failed to create course");
            }
        } catch (error) {
            console.error("Error creating course:", error);
            toast.error("An error occurred while creating the course: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    const addSection = () => {
        setFormData({
            ...formData,
            sections: [...formData.sections, { title: "New Section", lessons: [] }]
        });
    };

    const addLesson = (sectionIndex: number) => {
        const newSections = [...formData.sections];
        newSections[sectionIndex].lessons.push({
            title: "New Lesson",
            type: "video",
            videoUrl: "",
            videoDuration: 0,
            videoFilename: ""
        });
        setFormData({ ...formData, sections: newSections });
    };

    const handleVideoUpload = (sectionIndex: number, lessonIndex: number, videoData: { url: string; duration: number; filename: string }) => {
        const newSections = [...formData.sections];
        const lesson = newSections[sectionIndex].lessons[lessonIndex];
        lesson.videoUrl = videoData.url;
        lesson.videoDuration = videoData.duration;
        lesson.videoFilename = videoData.filename;
        setFormData({ ...formData, sections: newSections });
    };

    // Helper functions for dynamic arrays
    const addOutcome = () => {
        setFormData({ ...formData, learningOutcomes: [...formData.learningOutcomes, ""] });
    };

    const removeOutcome = (index: number) => {
        setFormData({ ...formData, learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== index) });
    };

    const updateOutcome = (index: number, value: string) => {
        const newOutcomes = [...formData.learningOutcomes];
        newOutcomes[index] = value;
        setFormData({ ...formData, learningOutcomes: newOutcomes });
    };

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

    const toggleLessonExpand = (sectionIndex: number, lessonIndex: number) => {
        if (expandedLesson?.section === sectionIndex && expandedLesson?.lesson === lessonIndex) {
            setExpandedLesson(null);
        } else {
            setExpandedLesson({ section: sectionIndex, lesson: lessonIndex });
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Create New Course</h1>
                    <p className="text-[var(--muted-foreground)]">Share your knowledge with the world</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/studio/courses">Cancel</Link>
                    </Button>
                    <PreviewButton formData={formData} />
                    <Button variant="outline" onClick={handleSubmit} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button onClick={async () => {
                        const result = await createCourse({ ...formData, status: "pending" });
                        if (result.success) {
                            toast.success("Course submitted for review!");
                            router.push("/studio/courses");
                        } else {
                            toast.error(result.error || "Failed to submit course");
                        }
                    }} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Review
                    </Button>
                </div>
            </div>

            <div className="flex gap-8">
                {/* Sidebar Steps */}
                <div className="w-64 flex-shrink-0 space-y-6">
                    <Card className="p-2">
                        {steps.map((step, index) => {
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setCurrentStep(index)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? "bg-[var(--secondary-100)] text-[var(--secondary-700)]"
                                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive
                                            ? "border-[var(--secondary-500)] bg-[var(--secondary-500)] text-white"
                                            : isCompleted
                                                ? "border-green-500 bg-green-500 text-white"
                                                : "border-[var(--muted-foreground)]"
                                            }`}
                                    >
                                        <step.icon className="w-4 h-4" />
                                    </div>
                                    {step.label}
                                </button>
                            );
                        })}
                    </Card>

                    {/* Progress Checklist */}
                    <ProgressChecklist courseData={formData} />
                </div>

                {/* content Area */}
                <div className="flex-1">
                    <Card className="p-6">
                        {/* Step 1: Basic Info */}
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <Input
                                    label="Course Title"
                                    placeholder="e.g. Master Watercolor Painting"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                                <Input
                                    label="Subtitle"
                                    placeholder="e.g. Learn the basics of watercolor in 30 days"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                />
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        className="w-full min-h-[150px] p-3 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                        placeholder="Describe what students will learn..."
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
                                            {courseCategories.map((cat) => (
                                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Level</label>
                                        <select
                                            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                            value={formData.level}
                                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        >
                                            <option value="all">All Levels</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Learning Outcomes */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Learning Outcomes (minimum 3)</label>
                                        <Button size="sm" variant="outline" onClick={addOutcome}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Outcome
                                        </Button>
                                    </div>
                                    {formData.learningOutcomes.map((outcome, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                                placeholder="What students will learn..."
                                                value={outcome}
                                                onChange={(e) => updateOutcome(index, e.target.value)}
                                            />
                                            {formData.learningOutcomes.length > 1 && (
                                                <button
                                                    onClick={() => removeOutcome(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Target Audience */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Target Audience</label>
                                        <Button size="sm" variant="outline" onClick={addTargetAudience}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Audience
                                        </Button>
                                    </div>
                                    {formData.targetAudience.map((audience, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                                placeholder="Who is this course for..."
                                                value={audience}
                                                onChange={(e) => updateTargetAudience(index, e.target.value)}
                                            />
                                            {formData.targetAudience.length > 1 && (
                                                <button
                                                    onClick={() => removeTargetAudience(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Prerequisites */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Prerequisites (optional)</label>
                                        <Button size="sm" variant="outline" onClick={addPrerequisite}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Prerequisite
                                        </Button>
                                    </div>
                                    {formData.prerequisites.map((prerequisite, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                                placeholder="What students need before starting..."
                                                value={prerequisite}
                                                onChange={(e) => updatePrerequisite(index, e.target.value)}
                                            />
                                            {formData.prerequisites.length > 1 && (
                                                <button
                                                    onClick={() => removePrerequisite(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Curriculum */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Course Content</h2>
                                    <Button size="sm" variant="outline" onClick={addSection}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Section
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {formData.sections.map((section, sIndex) => (
                                        <div key={sIndex} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--muted)]/30">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="font-bold text-[var(--muted-foreground)]">S{sIndex + 1}</span>
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-transparent border-none font-medium text-lg focus:outline-none focus:ring-0"
                                                    value={section.title}
                                                    onChange={(e) => {
                                                        const newSections = [...formData.sections];
                                                        newSections[sIndex].title = e.target.value;
                                                        setFormData({ ...formData, sections: newSections });
                                                    }}
                                                    placeholder="Section title"
                                                />
                                                <button className="text-[var(--muted-foreground)] hover:text-red-500">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="space-y-2 pl-4 border-l-2 border-[var(--border)]">
                                                {section.lessons.map((lesson, lIndex) => {
                                                    const lessonData = lesson;
                                                    const isExpanded = expandedLesson?.section === sIndex && expandedLesson?.lesson === lIndex;
                                                    const hasVideo = !!lessonData.videoUrl;

                                                    return (
                                                        <div key={lIndex} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
                                                            <div
                                                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                                                                onClick={() => toggleLessonExpand(sIndex, lIndex)}
                                                            >
                                                                {hasVideo ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <Video className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                                                                )}
                                                                <input
                                                                    type="text"
                                                                    className="flex-1 border-none text-sm focus:outline-none bg-transparent"
                                                                    value={lesson.title}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        const newSections = [...formData.sections];
                                                                        newSections[sIndex].lessons[lIndex].title = e.target.value;
                                                                        setFormData({ ...formData, sections: newSections });
                                                                    }}
                                                                />
                                                                {hasVideo && (
                                                                    <span className="text-xs text-green-600 px-2">
                                                                        {formatDuration(lessonData.videoDuration || 0)}
                                                                    </span>
                                                                )}
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                                )}
                                                            </div>

                                                            {isExpanded && (
                                                                <div className="p-4 border-t border-[var(--border)] bg-gray-50 space-y-4">
                                                                    {/* Lecture Type Selector */}
                                                                    <div className="space-y-2">
                                                                        <label className="text-sm font-medium">Lecture Type</label>
                                                                        <select
                                                                            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                                                            value={lessonData.type}
                                                                            onChange={(e) => {
                                                                                const newSections = [...formData.sections];
                                                                                newSections[sIndex].lessons[lIndex].type = e.target.value as "video" | "article" | "resource" | "project";
                                                                                setFormData({ ...formData, sections: newSections });
                                                                            }}
                                                                        >
                                                                            <option value="video">Video Lecture</option>
                                                                            <option value="article">Article/Text Lecture</option>
                                                                            <option value="resource">Resource Files</option>
                                                                            <option value="project">Project Assignment</option>
                                                                        </select>
                                                                    </div>

                                                                    {/* Conditional Content Editor */}
                                                                    {lessonData.type === "video" && (
                                                                        <>
                                                                            <p className="text-sm text-[var(--muted-foreground)]">
                                                                                Upload a video for this lesson
                                                                            </p>
                                                                            <VideoUploader
                                                                                onUploadComplete={(videoData) => handleVideoUpload(sIndex, lIndex, videoData)}
                                                                                existingVideo={hasVideo ? {
                                                                                    url: lessonData.videoUrl!,
                                                                                    duration: lessonData.videoDuration || 0,
                                                                                    filename: lessonData.videoFilename || "video.mp4"
                                                                                } : undefined}
                                                                                maxSizeMB={500}
                                                                            />
                                                                        </>
                                                                    )}

                                                                    {lessonData.type === "article" && (
                                                                        <ArticleLectureEditor
                                                                            onContentChange={(content) => {
                                                                                const newSections = [...formData.sections];
                                                                                newSections[sIndex].lessons[lIndex].articleContent = content;
                                                                                setFormData({ ...formData, sections: newSections });
                                                                            }}
                                                                            existingContent={lessonData.articleContent || ""}
                                                                        />
                                                                    )}

                                                                    {lessonData.type === "resource" && (
                                                                        <ResourceLectureUploader
                                                                            onUploadComplete={(files) => {
                                                                                const newSections = [...formData.sections];
                                                                                newSections[sIndex].lessons[lIndex].resourceFiles = files;
                                                                                setFormData({ ...formData, sections: newSections });
                                                                            }}
                                                                            existingFiles={lessonData.resourceFiles || []}
                                                                        />
                                                                    )}

                                                                    {lessonData.type === "project" && (
                                                                        <ProjectLectureEditor
                                                                            existingContent={lessonData.projectContent || { instructions: "", expectedOutcome: "", referenceImages: [] }}
                                                                            onContentChange={(content) => {
                                                                                const newSections = [...formData.sections];
                                                                                newSections[sIndex].lessons[lIndex].projectContent = content;
                                                                                setFormData({ ...formData, sections: newSections });
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => addLesson(sIndex)}
                                                    className="flex items-center gap-2 text-sm text-[var(--secondary-600)] hover:underline mt-2"
                                                >
                                                    <Plus className="w-4 h-4" /> Add Lesson
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                        }

                        {/* Step 3: Media */}
                        {
                            currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-medium">Course Thumbnail</h3>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            Upload a high-quality thumbnail that represents your course
                                        </p>
                                        <ThumbnailUploader
                                            onUploadComplete={(imageData) => setFormData({ ...formData, thumbnail: imageData.url })}
                                            existingImage={formData.thumbnail ? { url: formData.thumbnail, filename: "thumbnail.jpg" } : undefined}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-medium">Promo Video (Optional)</h3>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            Add a short promotional video to attract students
                                        </p>
                                        <VideoUploader
                                            onUploadComplete={(videoData) => setFormData({ ...formData, promoVideo: videoData.url })}
                                            existingVideo={formData.promoVideo ? { url: formData.promoVideo, duration: 0, filename: "promo.mp4" } : undefined}
                                            maxSizeMB={100}
                                        />
                                    </div>
                                </div>
                            )
                        }

                        {/* Step 4: Pricing */}
                        {
                            currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Currency</label>
                                            <select
                                                className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-white"
                                                value={formData.currency}
                                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                                disabled
                                            >
                                                <option value="USD">USD ($)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Price</label>
                                            <Input
                                                placeholder="0.00"
                                                type="number"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[var(--muted)] rounded-lg">
                                        <h4 className="font-medium mb-2">Revenue Share</h4>
                                        <p className="text-sm text-[var(--muted-foreground)]">
                                            Platform fee is 10%. You keep 90% of every sale.
                                        </p>
                                    </div>
                                </div>
                            )
                        }
                    </Card >

                    {/* Navigation Buttons */}
                    < div className="flex justify-between mt-6" >
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
                            disabled={isLoading}
                        >
                            {currentStep === steps.length - 1 ? (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Draft
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div >
                </div >
            </div >
        </div >
    );
}
