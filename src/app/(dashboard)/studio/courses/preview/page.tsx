"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getPreviewData, clearPreviewData, type CoursePreviewData } from "@/lib/utils/coursePreview";
import { Button } from "@/components/atoms";
import { ArrowLeft, X, AlertCircle, Play, Clock, Users, Star, CheckCircle, Lock } from "lucide-react";

export default function CoursePreviewPage() {
    const router = useRouter();
    const [courseData, setCourseData] = React.useState<CoursePreviewData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const data = getPreviewData();
        setCourseData(data);
        setIsLoading(false);
    }, []);

    const handleExitPreview = () => {
        clearPreviewData();
        window.close();
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--secondary-500)] mx-auto mb-4"></div>
                    <p className="text-[var(--muted-foreground)]">Loading preview...</p>
                </div>
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">No Preview Data Found</h1>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        Unable to load course preview. Please try generating the preview again.
                    </p>
                    <Button onClick={() => window.close()}>Close Preview</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Preview Mode Banner */}
            <div className="bg-amber-500 text-white py-3 px-4 sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Preview Mode - This is how your course will appear to students</span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExitPreview}
                        className="bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Exit Preview
                    </Button>
                </div>
            </div>

            {/* Course Header */}
            <div className="bg-gradient-to-br from-[var(--secondary-900)] to-[var(--secondary-700)] text-white py-12">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Course Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="px-3 py-1 bg-white/20 rounded-full">{courseData.category}</span>
                            <span className="px-3 py-1 bg-white/20 rounded-full">{courseData.level}</span>
                        </div>

                        <h1 className="text-4xl font-bold">{courseData.title}</h1>

                        {courseData.subtitle && (
                            <p className="text-xl text-white/90">{courseData.subtitle}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{courseData.averageRating || "New"}</span>
                                <span className="text-white/75">({courseData.reviewCount} reviews)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                <span>{courseData.totalStudents} students</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                <span>{formatDuration(courseData.totalDuration)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {courseData.instructor.avatar ? (
                                <img
                                    src={courseData.instructor.avatar}
                                    alt={courseData.instructor.name}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">
                                    {courseData.instructor.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-medium">Created by {courseData.instructor.name}</p>
                                <p className="text-sm text-white/75">{courseData.instructor.bio}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Course Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl overflow-hidden shadow-xl sticky top-24">
                            {courseData.thumbnail && (
                                <div className="relative aspect-video bg-gray-200">
                                    <img
                                        src={courseData.thumbnail}
                                        alt={courseData.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {courseData.promoVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 cursor-pointer transition">
                                            <Play className="w-16 h-16 text-white" />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="p-6 space-y-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-gray-900">
                                        {courseData.currency === "USD" ? "$" : courseData.currency}
                                        {courseData.price.toFixed(2)}
                                    </p>
                                </div>
                                <Button className="w-full" size="lg">
                                    Enroll Now
                                </Button>
                                <div className="text-xs text-center text-gray-500">
                                    30-Day Money-Back Guarantee
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* What You'll Learn */}
                        {courseData.learningOutcomes.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {courseData.learningOutcomes.map((outcome, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700">{outcome}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-2xl font-bold mb-4">Description</h2>
                            <p className="text-gray-700 whitespace-pre-line">{courseData.description}</p>
                        </div>

                        {/* Curriculum */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-2xl font-bold mb-2">Course Content</h2>
                            <p className="text-gray-600 mb-6">
                                {courseData.sections.length} sections • {courseData.totalLectures} lectures • {formatDuration(courseData.totalDuration)} total length
                            </p>
                            <div className="space-y-2">
                                {courseData.sections.map((section, sIndex) => (
                                    <details key={sIndex} className="group border border-gray-200 rounded-lg">
                                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold">{section.title}</span>
                                                <span className="text-sm text-gray-500">
                                                    {section.lessons.length} lectures
                                                </span>
                                            </div>
                                        </summary>
                                        <div className="border-t border-gray-200 bg-gray-50">
                                            {section.lessons.map((lesson, lIndex) => (
                                                <div
                                                    key={lIndex}
                                                    className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Play className="w-4 h-4 text-gray-400" />
                                                        <span className="text-gray-700">{lesson.title}</span>
                                                        {lesson.isFree && (
                                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                                                Preview
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {lesson.duration > 0 && (
                                                            <span className="text-sm text-gray-500">
                                                                {formatDuration(lesson.duration)}
                                                            </span>
                                                        )}
                                                        {!lesson.isFree && <Lock className="w-4 h-4 text-gray-400" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>

                        {/* Requirements */}
                        {courseData.prerequisites.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                                <ul className="space-y-2">
                                    {courseData.prerequisites.map((prereq, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-gray-400 mt-1">•</span>
                                            <span className="text-gray-700">{prereq}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Target Audience */}
                        {courseData.targetAudience.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-gray-200">
                                <h2 className="text-2xl font-bold mb-4">Who this course is for</h2>
                                <ul className="space-y-2">
                                    {courseData.targetAudience.map((audience, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-gray-400 mt-1">•</span>
                                            <span className="text-gray-700">{audience}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Empty for now, could add related courses */}
                    <div className="lg:col-span-1">
                        {/* Intentionally empty - reserved for future features */}
                    </div>
                </div>
            </div>
        </div>
    );
}
