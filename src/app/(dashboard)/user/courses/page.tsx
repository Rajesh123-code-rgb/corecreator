"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { PlayCircle, Search, SlidersHorizontal, Loader2, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface EnrolledCourse {
    id: string; // _id from API
    title: string;
    slug: string;
    thumbnail: string;
    instructor: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
}

export default function MyCoursesPage() {
    const { t } = useLanguage();
    const [courses, setCourses] = React.useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch("/api/user/courses");
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                }
            } catch (error) {
                console.error("Failed to fetch my courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t("dashboard.courses.title")}</h1>
                    <p className="text-[var(--muted-foreground)]">{t("dashboard.courses.subtitle")}</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder={t("dashboard.courses.search_placeholder")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)] text-sm w-full md:w-64"
                        />
                    </div>
                    {/* Filter button - client side filtering could be expanded if needed */}
                    <Button variant="outline" size="sm" className="hidden md:flex">
                        <SlidersHorizontal className="w-4 h-4 mr-2" /> {t("dashboard.courses.filter")}
                    </Button>
                </div>
            </div>

            {filteredCourses.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <Card key={course.id} className="group overflow-hidden flex flex-col h-full">
                            <Link href={`/learn/${course.slug}/player`} className="relative aspect-video overflow-hidden">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <PlayCircle className="w-14 h-14 text-white" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                                    <div
                                        className="h-full bg-[var(--secondary-500)]"
                                        style={{ width: `${course.progress}%` }}
                                    />
                                </div>
                            </Link>

                            <CardContent className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-[var(--secondary-600)] transition-colors">
                                    <Link href={`/learn/${course.slug}/player`}>{course.title}</Link>
                                </h3>
                                <p className="text-sm text-[var(--muted-foreground)] mb-4">by {course.instructor}</p>

                                <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm">
                                    <span className="font-medium text-[var(--secondary-600)]">{course.progress}% {t("dashboard.courses.complete")}</span>
                                    <span className="text-[var(--muted-foreground)]">{course.completedLessons}/{course.totalLessons} {t("dashboard.courses.lessons")}</span>
                                </div>

                                <Button className="w-full mt-4" variant={course.progress > 0 ? "secondary" : "outline"} asChild>
                                    <Link href={`/learn/${course.slug}/player`}>
                                        {course.progress > 0 ? t("dashboard.courses.continue") : t("dashboard.courses.start")}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <CardContent>
                        <BookOpen className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" />
                        <h3 className="text-lg font-medium">{t("dashboard.no_courses").replace(" enolled yet", "")}</h3>
                        <p className="text-[var(--muted-foreground)] text-sm mt-1">
                            {searchTerm ? t("dashboard.courses.empty_search") : t("dashboard.courses.empty")}
                        </p>
                        {!searchTerm && (
                            <Button className="mt-4" asChild>
                                <Link href="/learn">{t("dashboard.courses.browse")}</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
