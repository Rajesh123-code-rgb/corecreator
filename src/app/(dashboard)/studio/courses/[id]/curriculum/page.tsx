"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input } from "@/components/atoms";
import { Card, VideoUploader, ArticleLectureEditor, ResourceLectureUploader, ProjectLectureEditor } from "@/components/molecules";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Save, Video, FileText, File, CheckCircle, GripVertical, Briefcase } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Lesson {
    id: string; // Added for DnD key
    title: string;
    type: "video" | "article" | "resource" | "project";
    videoUrl?: string;
    videoDuration?: number;
    videoFilename?: string;
    articleContent?: string;
    resourceFiles?: Array<{ url: string; type: string; name: string; size: number }>;
    textContent?: string;
    projectContent?: {
        instructions: string;
        expectedOutcome: string;
        referenceImages: string[];
    };
    description: string;
}

interface Section {
    id: string; // Added for DnD key
    title: string;
    description: string;
    lessons: Lesson[];
}

export default function CourseCurriculumPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [sections, setSections] = React.useState<Section[]>([]);
    const [expandedLesson, setExpandedLesson] = React.useState<{ section: number; lesson: number } | null>(null);

    React.useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/studio/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    const flattenedSections = (data.sections || []).map((section: any) => ({
                        id: section._id || Math.random().toString(36).substr(2, 9),
                        title: section.title,
                        description: section.description || "",
                        lessons: (section.lessons || []).map((lesson: any) => ({
                            id: lesson._id || Math.random().toString(36).substr(2, 9),
                            title: lesson.title,
                            type: lesson.type || "video",
                            videoUrl: lesson.content?.videoUrl || "",
                            videoDuration: lesson.content?.videoDuration || 0,
                            videoFilename: lesson.content?.videoFilename || "",
                            articleContent: lesson.content?.articleContent || "",
                            resourceFiles: lesson.content?.resourceFiles || [],
                            projectContent: lesson.content?.projectContent || { instructions: "", expectedOutcome: "", referenceImages: [] },
                            description: lesson.description || ""
                        }))
                    }));
                    setSections(flattenedSections);
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

    const addSection = () => {
        setSections([...sections, {
            id: Math.random().toString(36).substr(2, 9),
            title: "New Section",
            description: "",
            lessons: []
        }]);
    };

    const addLesson = (sectionIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].lessons.push({
            id: Math.random().toString(36).substr(2, 9),
            title: "New Lesson",
            type: "video",
            videoUrl: "",
            videoDuration: 0,
            videoFilename: "",
            articleContent: "",
            resourceFiles: [],
            projectContent: { instructions: "", expectedOutcome: "", referenceImages: [] },
            description: ""
        });
        setSections(newSections);
        setExpandedLesson({ section: sectionIndex, lesson: newSections[sectionIndex].lessons.length - 1 });
    };

    const updateSection = (index: number, field: string, value: string) => {
        const newSections = [...sections];
        (newSections[index] as any)[field] = value;
        setSections(newSections);
    };

    const updateLesson = (sectionIndex: number, lessonIndex: number, field: string, value: any) => {
        const newSections = [...sections];
        (newSections[sectionIndex].lessons[lessonIndex] as any)[field] = value;
        setSections(newSections);
    };

    const handleVideoUpload = (sectionIndex: number, lessonIndex: number, videoData: { url: string; duration: number; filename: string }) => {
        const newSections = [...sections];
        newSections[sectionIndex].lessons[lessonIndex].videoUrl = videoData.url;
        newSections[sectionIndex].lessons[lessonIndex].videoDuration = videoData.duration;
        newSections[sectionIndex].lessons[lessonIndex].videoFilename = videoData.filename;
        setSections(newSections);
    };

    const handleResourceUpload = (sectionIndex: number, lessonIndex: number, files: Array<{ url: string; type: string; name: string; size?: number }>) => {
        const newSections = [...sections];
        newSections[sectionIndex].lessons[lessonIndex].resourceFiles = files.map(f => ({
            ...f,
            size: f.size || 0
        }));
        setSections(newSections);
    };

    const handleProjectUpdate = (sectionIndex: number, lessonIndex: number, content: any) => {
        const newSections = [...sections];
        newSections[sectionIndex].lessons[lessonIndex].projectContent = content;
        setSections(newSections);
    };

    const deleteSection = (index: number) => {
        if (confirm("Are you sure you want to delete this section?")) {
            setSections(sections.filter((_, i) => i !== index));
        }
    };

    const deleteLesson = (sectionIndex: number, lessonIndex: number) => {
        if (confirm("Are you sure you want to delete this lesson?")) {
            const newSections = [...sections];
            newSections[sectionIndex].lessons = newSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
            setSections(newSections);
            if (expandedLesson?.section === sectionIndex && expandedLesson?.lesson === lessonIndex) {
                setExpandedLesson(null);
            }
        }
    };

    const toggleLessonExpand = (sectionIndex: number, lessonIndex: number) => {
        if (expandedLesson?.section === sectionIndex && expandedLesson?.lesson === lessonIndex) {
            setExpandedLesson(null);
        } else {
            setExpandedLesson({ section: sectionIndex, lesson: lessonIndex });
        }
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === "section") {
            const newSections = Array.from(sections);
            const [removed] = newSections.splice(source.index, 1);
            newSections.splice(destination.index, 0, removed);
            setSections(newSections);
            return;
        }

        // Handle Lesson Reordering
        // Droppable ID format: "section-{index}"
        const sourceSectionIndex = parseInt(source.droppableId.split("-")[1]);
        const destSectionIndex = parseInt(destination.droppableId.split("-")[1]);

        const sourceSection = sections[sourceSectionIndex];
        const destSection = sections[destSectionIndex];

        const sourceLessons = Array.from(sourceSection.lessons);
        const destLessons = sourceSectionIndex === destSectionIndex
            ? sourceLessons
            : Array.from(destSection.lessons);

        const [removed] = sourceLessons.splice(source.index, 1);
        destLessons.splice(destination.index, 0, removed);

        const newSections = [...sections];
        newSections[sourceSectionIndex] = { ...sourceSection, lessons: sourceLessons };
        if (sourceSectionIndex !== destSectionIndex) {
            newSections[destSectionIndex] = { ...destSection, lessons: destLessons };
        }

        setSections(newSections);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/studio/courses/${courseId}/curriculum`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sections }),
            });

            if (res.ok) {
                router.push("/studio/courses");
            } else {
                alert("Failed to update curriculum");
            }
        } catch (error) {
            console.error("Error updating curriculum:", error);
            alert("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const getLessonIcon = (type: string, hasContent: boolean) => {
        if (type === "article") {
            return hasContent ?
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                <FileText className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />;
        }
        if (type === "resource") {
            return hasContent ?
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                <File className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />;
        }
        if (type === "project") {
            return hasContent ?
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                <Briefcase className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />;
        }
        return hasContent ?
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
            <Video className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />;
    };

    const hasContent = (lesson: Lesson): boolean => {
        if (lesson.type === "video") return !!lesson.videoUrl;
        if (lesson.type === "article") return !!lesson.articleContent;
        if (lesson.type === "resource") return (lesson.resourceFiles?.length || 0) > 0;
        if (lesson.type === "project") return !!(lesson.projectContent?.instructions);
        return false;
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <Link href="/studio/courses" className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-2">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Courses
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Edit Curriculum</h1>
                        <p className="text-[var(--muted-foreground)]">Drag and drop to reorder sections and lessons</p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sections" type="section">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                            {sections.map((section, sIndex) => (
                                <Draggable key={section.id} draggableId={`section-${section.id}`} index={sIndex}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="border border-[var(--border)] rounded-lg p-4 bg-[var(--muted)]/30"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div {...provided.dragHandleProps} className="cursor-grab hover:text-[var(--foreground)] text-[var(--muted-foreground)]">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-[var(--muted-foreground)]">S{sIndex + 1}</span>
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-transparent border-none font-medium text-lg focus:outline-none focus:ring-0"
                                                    value={section.title}
                                                    placeholder="Section title"
                                                    onChange={(e) => updateSection(sIndex, "title", e.target.value)}
                                                />
                                                <button
                                                    onClick={() => deleteSection(sIndex)}
                                                    className="text-[var(--muted-foreground)] hover:text-red-500"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="pl-4 border-l-2 border-[var(--border)]">
                                                <Droppable droppableId={`section-${sIndex}`} type="lesson">
                                                    {(provided) => (
                                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                                            {section.lessons.map((lesson, lIndex) => {
                                                                const isExpanded = expandedLesson?.section === sIndex && expandedLesson?.lesson === lIndex;
                                                                const hasLessonContent = hasContent(lesson);

                                                                return (
                                                                    <Draggable key={lesson.id} draggableId={`lesson-${lesson.id}`} index={lIndex}>
                                                                        {(provided) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                className="bg-white rounded-lg border border-[var(--border)] overflow-hidden"
                                                                            >
                                                                                <div
                                                                                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                                                                                    onClick={() => toggleLessonExpand(sIndex, lIndex)}
                                                                                >
                                                                                    <div {...provided.dragHandleProps} className="cursor-grab hover:text-[var(--foreground)] text-[var(--muted-foreground)]">
                                                                                        <GripVertical className="w-4 h-4" />
                                                                                    </div>
                                                                                    {getLessonIcon(lesson.type, hasLessonContent)}
                                                                                    <input
                                                                                        type="text"
                                                                                        className="flex-1 border-none text-sm focus:outline-none bg-transparent"
                                                                                        value={lesson.title}
                                                                                        placeholder="Lesson title"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        onChange={(e) => updateLesson(sIndex, lIndex, "title", e.target.value)}
                                                                                    />
                                                                                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                                                                        {lesson.type}
                                                                                    </span>
                                                                                    {lesson.type === "video" && hasLessonContent && (
                                                                                        <span className="text-xs text-green-600 px-2">
                                                                                            {formatDuration(lesson.videoDuration || 0)}
                                                                                        </span>
                                                                                    )}
                                                                                    {isExpanded ? (
                                                                                        <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                                                    ) : (
                                                                                        <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                                                    )}
                                                                                </div>

                                                                                {isExpanded && (
                                                                                    <div className="p-4 border-t border-[var(--border)] bg-gray-50 space-y-4 cursor-default">
                                                                                        {/* Lecture Type Selector */}
                                                                                        <div className="grid grid-cols-4 gap-2">
                                                                                            {["video", "article", "resource", "project"].map((t) => (
                                                                                                <button
                                                                                                    key={t}
                                                                                                    type="button"
                                                                                                    onClick={() => updateLesson(sIndex, lIndex, "type", t)}
                                                                                                    className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-2 py-2 rounded-lg border text-xs sm:text-sm capitalize ${lesson.type === t
                                                                                                        ? "border-[var(--primary-600)] bg-[var(--primary-50)]"
                                                                                                        : "border-[var(--border)] hover:border-[var(--primary-300)]"
                                                                                                        }`}
                                                                                                >
                                                                                                    {t === "video" && <Video className="w-4 h-4" />}
                                                                                                    {t === "article" && <FileText className="w-4 h-4" />}
                                                                                                    {t === "resource" && <File className="w-4 h-4" />}
                                                                                                    {t === "project" && <Briefcase className="w-4 h-4" />}
                                                                                                    <span>{t}</span>
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>

                                                                                        {/* Conditional Content Editors */}
                                                                                        {lesson.type === "video" && (
                                                                                            <VideoUploader
                                                                                                onUploadComplete={(videoData) => handleVideoUpload(sIndex, lIndex, videoData)}
                                                                                                existingVideo={lesson.videoUrl ? {
                                                                                                    url: lesson.videoUrl,
                                                                                                    duration: lesson.videoDuration || 0,
                                                                                                    filename: lesson.videoFilename || "video.mp4"
                                                                                                } : undefined}
                                                                                                maxSizeMB={500}
                                                                                            />
                                                                                        )}

                                                                                        {lesson.type === "article" && (
                                                                                            <ArticleLectureEditor
                                                                                                existingContent={lesson.articleContent || ""}
                                                                                                onContentChange={(content) => updateLesson(sIndex, lIndex, "articleContent", content)}
                                                                                            />
                                                                                        )}

                                                                                        {lesson.type === "resource" && (
                                                                                            <ResourceLectureUploader
                                                                                                existingFiles={lesson.resourceFiles || []}
                                                                                                onUploadComplete={(files) => handleResourceUpload(sIndex, lIndex, files)}
                                                                                            />
                                                                                        )}

                                                                                        {lesson.type === "project" && (
                                                                                            <ProjectLectureEditor
                                                                                                existingContent={lesson.projectContent || {}}
                                                                                                onContentChange={(content) => handleProjectUpdate(sIndex, lIndex, content)}
                                                                                            />
                                                                                        )}

                                                                                        <div className="pt-2 border-t">
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    deleteLesson(sIndex, lIndex);
                                                                                                }}
                                                                                                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                                                                                            >
                                                                                                <Trash2 className="w-3 h-3" />
                                                                                                Delete Lesson
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                );
                                                            })}
                                                            {provided.placeholder}
                                                            <button
                                                                onClick={() => addLesson(sIndex)}
                                                                className="flex items-center gap-2 text-sm text-[var(--secondary-600)] hover:underline mt-2"
                                                            >
                                                                <Plus className="w-4 h-4" /> Add Lesson
                                                            </button>
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            <Button onClick={addSection} variant="outline" className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Section
                            </Button>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
