"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/atoms";
import { CertificateDownloadButton, VideoPlayer } from "@/components/molecules";
import {
    ChevronLeft,
    ChevronRight,
    PlayCircle,
    CheckCircle,
    Menu,
    X,
    Download,
    Award,
    BookOpen,
    Clock,
    Loader2,
    MessageSquare
} from "lucide-react";

interface Lesson {
    _id?: string; // Mongoose subdocument ID
    title: string;
    description?: string;
    type: string;
    order: number;
    duration?: number;
    isFree: boolean;
    content?: {
        videoUrl?: string;
        videoDuration?: number;
        textContent?: string;
        attachments?: string[];
    };
}

interface Section {
    _id?: string;
    title: string;
    lessons: Lesson[];
    order: number;
}

interface Course {
    _id: string;
    title: string;
    slug: string;
    instructorName: string;
    thumbnail: string;
    sections: Section[];
    totalLessons: number;
}

interface Progress {
    lessonId: string;
    watchTime: number;
    completed: boolean;
}

export default function CoursePlayerPage() {
    const { data: session } = useSession();
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = params.slug as string;
    const lessonParam = searchParams.get("lesson");

    const [course, setCourse] = React.useState<Course | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<"content" | "resources" | "discussion">("content");
    const [userProgress, setUserProgress] = React.useState<Record<string, Progress>>({});
    const [currentLesson, setCurrentLesson] = React.useState<Lesson | null>(null);

    // Fetch Course
    React.useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/courses/${slug}`);
                if (!res.ok) throw new Error("Course not found");
                const data = await res.json();
                setCourse(data.course);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchCourse();
    }, [slug]);

    // Fetch Progress
    React.useEffect(() => {
        const fetchProgress = async () => {
            if (!course || !session?.user) return;
            try {
                const res = await fetch(`/api/progress?courseId=${course._id}`);
                if (res.ok) {
                    const data = await res.json();
                    // Convert array to record for easier lookup
                    const progressMap: Record<string, Progress> = {};
                    if (Array.isArray(data.progress)) {
                        data.progress.forEach((p: any) => {
                            progressMap[p.lessonId] = {
                                lessonId: p.lessonId,
                                watchTime: p.watchTime,
                                completed: p.completed || (p.watchTime / p.duration > 0.9) // Fallback logic
                            };
                        });
                    }
                    setUserProgress(progressMap);
                }
            } catch (error) {
                console.error("Failed to fetch progress", error);
            }
        };
        fetchProgress();
    }, [course, session]);

    // Set Current Lesson
    React.useEffect(() => {
        if (!course) return;

        let lesson: Lesson | undefined;

        // Flatten all lessons to find by ID
        const allLessons = course.sections.flatMap(s => s.lessons);

        if (lessonParam) {
            // Find by ID (assuming lesson._id matches or using index as fallback if needed)
            // Note: Since lessons are subdocs, they should have _id. If not, use logic to identify.
            lesson = allLessons.find(l => l._id === lessonParam);
        } else {
            // Default to first lesson
            lesson = allLessons[0];
        }

        if (lesson) {
            setCurrentLesson(lesson);
        }
    }, [course, lessonParam]);

    const handleLessonChange = (lessonId: string) => {
        router.push(`/learn/${slug}/player?lesson=${lessonId}`);
    };

    const handleProgressUpdate = async (progress: { currentTime: number; duration: number; percentage: number }) => {
        if (!course || !currentLesson?._id || !session?.user) return;

        // Optimistic update for UI if needed
        // Debounce or periodic save could be implemented here
    };

    const handleLessonComplete = async () => {
        if (!course || !currentLesson?._id) return;

        // Optimistic update
        setUserProgress(prev => ({
            ...prev,
            [currentLesson._id!]: { ...prev[currentLesson._id!], completed: true, watchTime: currentLesson.duration || 0 }
        }));

        // TODO: Call API to mark complete
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>;
    }

    if (!course) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Course not found</div>;
    }

    const allLessons = course.sections.flatMap(s => s.lessons);
    const completedCount = Object.values(userProgress).filter(p => p.completed).length;
    const progressPercent = allLessons.length > 0 ? (completedCount / allLessons.length) * 100 : 0;

    const currentIndex = allLessons.findIndex(l => l._id === currentLesson?._id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Top Bar */}
            <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link href={`/learn/${slug}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Course
                    </Link>
                    <div className="hidden md:block h-6 w-px bg-gray-700" />
                    <h1 className="hidden md:block text-sm font-medium truncate max-w-[300px]">{course.title}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-sm">
                        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className="text-gray-400">{Math.round(progressPercent)}% complete</span>
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-700 rounded-lg lg:hidden">
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-56px)]">
                {/* Video Player Area */}
                <main className={`flex-1 flex flex-col ${sidebarOpen ? "lg:mr-80" : ""}`}>
                    {/* Video */}
                    <div className="aspect-video bg-black">
                        {currentLesson?.content?.videoUrl ? (
                            <VideoPlayer
                                src={currentLesson.content.videoUrl}
                                poster={course.thumbnail} // or lesson specific thumb
                                onProgress={handleProgressUpdate}
                                onComplete={() => handleLessonComplete()}
                                className="w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <PlayCircle className="w-16 h-16 opacity-50" />
                                <p className="mt-4">Select a lesson to start watching</p>
                            </div>
                        )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="max-w-4xl">
                            {/* Navigation */}
                            <div className="flex items-center justify-between mb-4">
                                <Button
                                    variant="outline"
                                    className="text-gray-400 border-gray-700 hover:bg-gray-800"
                                    onClick={() => prevLesson && handleLessonChange(prevLesson._id!)}
                                    disabled={!prevLesson}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                                </Button>
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={handleLessonComplete}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-gray-400 border-gray-700 hover:bg-gray-800"
                                    onClick={() => nextLesson && handleLessonChange(nextLesson._id!)}
                                    disabled={!nextLesson}
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>

                            {/* Info Block */}
                            <div className="mt-8 p-6 bg-gray-800 rounded-xl border border-gray-700">
                                <h3 className="text-lg font-bold mb-4">Course Progress</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{Math.round(progressPercent)}% Completed</span>
                                        <span>{completedCount} / {allLessons.length} Lessons</span>
                                    </div>
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                                    </div>

                                    {progressPercent === 100 && (
                                        <div className="pt-4 mt-4 border-t border-gray-700">
                                            <div className="flex items-center gap-4 bg-green-900/20 text-green-400 p-4 rounded-lg mb-4">
                                                <Award className="w-8 h-8 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold">Congratulations!</p>
                                                    <p className="text-sm">You have successfully completed this course.</p>
                                                </div>
                                            </div>
                                            <CertificateDownloadButton
                                                studentName={session?.user?.name || "Student"}
                                                courseName={course.title}
                                                instructorName={course.instructorName}
                                                completionDate={new Date().toLocaleDateString()}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-6 border-b border-gray-700 mb-6 mt-8">
                                {[
                                    { id: "content", label: "Overview", icon: BookOpen },
                                    { id: "resources", label: "Resources", icon: Download },
                                    { id: "discussion", label: "Discussion", icon: MessageSquare },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 -mb-px ${activeTab === tab.id
                                            ? "border-purple-500 text-white"
                                            : "border-transparent text-gray-400 hover:text-white"
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            {activeTab === "content" && currentLesson && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">{currentLesson.title}</h2>
                                    <p className="text-gray-300 whitespace-pre-line">{currentLesson.description || "No description available."}</p>
                                </div>
                            )}

                            {activeTab === "resources" && (
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold mb-4">Downloadable Resources</h2>
                                    <p className="text-gray-400">No resources attached to this lesson.</p>
                                </div>
                            )}

                            {activeTab === "discussion" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Discussion</h2>
                                    <div className="p-6 bg-gray-800 rounded-lg text-center">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                        <p className="text-gray-400">Join the conversation. Ask questions or share your insights.</p>
                                        <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium">
                                            Start Discussion
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Course Sidebar */}
                <aside className={`fixed right-0 top-14 h-[calc(100vh-56px)] w-80 bg-gray-800 border-l border-gray-700 overflow-auto transform transition-transform ${sidebarOpen ? "translate-x-0" : "translate-x-full"
                    } lg:translate-x-0`}>
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="font-semibold">Course Content</h2>
                        <p className="text-sm text-gray-400">{completedCount}/{allLessons.length} lessons completed</p>
                    </div>

                    <div className="divide-y divide-gray-700">
                        {course.sections.map((section, sIndex) => (
                            <div key={sIndex}>
                                <div className="px-4 py-3 bg-gray-750">
                                    <p className="text-sm font-medium">Section {sIndex + 1}: {section.title}</p>
                                    <p className="text-xs text-gray-400">
                                        {section.lessons.filter(l => userProgress[l._id!]?.completed).length}/{section.lessons.length} completed
                                    </p>
                                </div>
                                <div className="divide-y divide-gray-700/50">
                                    {section.lessons.map((lesson) => {
                                        const isCompleted = userProgress[lesson._id!]?.completed;
                                        const isActive = currentLesson?._id === lesson._id;
                                        return (
                                            <button
                                                key={lesson._id}
                                                onClick={() => handleLessonChange(lesson._id!)}
                                                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors ${isActive ? "bg-gray-700" : ""
                                                    }`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                ) : isActive ? (
                                                    <PlayCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <PlayCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${isActive ? "text-white" : "text-gray-300"}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{lesson.duration ? `${lesson.duration}m` : 'Video'}</span>
                                                        {lesson.isFree && <span className="text-purple-400">Free Preview</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
