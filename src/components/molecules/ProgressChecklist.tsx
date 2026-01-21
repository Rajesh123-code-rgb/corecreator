"use client";

import * as React from "react";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface ProgressChecklistProps {
    courseData: {
        title: string;
        description: string;
        category: string;
        price: string;
        thumbnail: string;
        promoVideo?: string;
        learningOutcomes: string[];
        targetAudience: string[];
        prerequisites: string[];
        sections: Array<{
            lessons: Array<{ title: string }>;
        }>;
    };
    className?: string;
}

interface CheckItem {
    label: string;
    completed: boolean;
    required: boolean;
}

export function ProgressChecklist({ courseData, className = "" }: ProgressChecklistProps) {
    const checks: CheckItem[] = [
        {
            label: "Course title (10-60 characters)",
            completed: courseData.title.trim().length >= 10 && courseData.title.trim().length <= 60,
            required: true,
        },
        {
            label: "Course description",
            completed: courseData.description.trim().length > 0,
            required: true,
        },
        {
            label: "Category selected",
            completed: courseData.category.trim().length > 0,
            required: true,
        },
        {
            label: "Price set",
            completed: courseData.price.trim().length > 0 && parseFloat(courseData.price) >= 0,
            required: true,
        },
        {
            label: "Thumbnail uploaded",
            completed: courseData.thumbnail.trim().length > 0,
            required: true,
        },
        {
            label: "At least 3 learning outcomes",
            completed: courseData.learningOutcomes.filter(o => o.trim() !== "").length >= 3,
            required: true,
        },
        {
            label: "At least 2 lectures",
            completed: courseData.sections.reduce((sum, section) => sum + section.lessons.length, 0) >= 2,
            required: true,
        },
        {
            label: "Promo video uploaded",
            completed: (courseData.promoVideo?.trim().length || 0) > 0,
            required: false,
        },
        {
            label: "Target audience defined",
            completed: courseData.targetAudience.filter(a => a.trim() !== "").length > 0,
            required: false,
        },
        {
            label: "Prerequisites listed",
            completed: courseData.prerequisites.filter(p => p.trim() !== "").length > 0,
            required: false,
        },
    ];

    const requiredChecks = checks.filter(c => c.required);
    const optionalChecks = checks.filter(c => !c.required);
    const completedRequired = requiredChecks.filter(c => c.completed).length;
    const completedOptional = optionalChecks.filter(c => c.completed).length;
    const totalCompleted = checks.filter(c => c.completed).length;
    const progressPercentage = Math.round((totalCompleted / checks.length) * 100);
    const isReadyToPublish = requiredChecks.every(c => c.completed);

    return (
        <div className={`bg-white rounded-xl border border-[var(--border)] p-6 ${className}`}>
            <div className="space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-semibold mb-1">Course Readiness</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Complete all required items to publish your course
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{progressPercentage}% Complete</span>
                        <span className="text-[var(--muted-foreground)]">
                            {totalCompleted} of {checks.length} items
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    ${isReadyToPublish
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }
                `}>
                    {isReadyToPublish ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Ready to publish!</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-4 h-4" />
                            <span>Complete required items to publish</span>
                        </>
                    )}
                </div>

                {/* Required Checklist */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                        Required ({completedRequired}/{requiredChecks.length})
                    </h4>
                    <div className="space-y-2">
                        {requiredChecks.map((check, index) => (
                            <div key={index} className="flex items-center gap-3">
                                {check.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                )}
                                <span className={`text-sm ${check.completed ? "text-gray-900" : "text-gray-500"}`}>
                                    {check.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Optional Checklist */}
                <div className="space-y-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900">
                        Optional ({completedOptional}/{optionalChecks.length})
                    </h4>
                    <div className="space-y-2">
                        {optionalChecks.map((check, index) => (
                            <div key={index} className="flex items-center gap-3">
                                {check.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                )}
                                <span className={`text-sm ${check.completed ? "text-gray-900" : "text-gray-500"}`}>
                                    {check.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
