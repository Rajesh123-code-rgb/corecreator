"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import {
    Star,
    Clock,
    Users,
    PlayCircle,
    BookOpen,
    Award,
    Loader2,
    SlidersHorizontal,
    Search
} from "lucide-react";

interface Instructor {
    _id: string;
    name: string;
    avatar?: string;
}

interface Course {
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    instructor: Instructor;
    instructorName: string;
    price: number;
    compareAtPrice?: number;
    rating: number;
    reviewCount: number;
    enrollmentCount: number;
    duration: number;
    totalLessons?: number;
    level: string;
    isBestseller?: boolean;
}

export default function CategoryCourseList({ categorySlug }: { categorySlug: string }) {
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sortBy, setSortBy] = React.useState("popular");

    React.useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("category", categorySlug);
                params.set("limit", "20");
                params.set("sort", sortBy);

                const res = await fetch(`/api/courses?${params.toString()}`);
                const data = await res.json();

                if (data.courses) {
                    setCourses(data.courses);
                }
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [categorySlug, sortBy]);

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <p className="text-[var(--muted-foreground)]">
                    Showing <strong>{courses.length}</strong> results
                </p>

                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                    >
                        <option value="popular">Most Popular</option>
                        <option value="rating">Highest Rated</option>
                        <option value="newest">Newest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                    <SlidersHorizontal className="w-4 h-4 text-[var(--muted-foreground)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
                </div>
            ) : courses.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Card key={course._id} hover className="group overflow-hidden bg-[var(--card)] border-[var(--border)]">
                            <div className="relative aspect-video overflow-hidden">
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                {course.isBestseller && (
                                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded-full flex items-center gap-1">
                                        <Award className="w-3 h-3" /> Bestseller
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <PlayCircle className="w-14 h-14 text-white" />
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <Link href={`/learn/${course.slug}`} className="font-semibold text-sm line-clamp-2 hover:text-purple-600 transition-colors mb-2 block">
                                    {course.title}
                                </Link>
                                <div className="flex items-center gap-2 mb-2">
                                    {course.instructor.avatar ? (
                                        <img src={course.instructor.avatar} alt={course.instructor.name} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] uppercase font-bold text-gray-500">
                                            {(course.instructor.name || course.instructorName || "I").charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-xs text-[var(--muted-foreground)]">{course.instructor.name || course.instructorName}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-xs text-[var(--muted-foreground)]">({(course.reviewCount || 0).toLocaleString()})</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mb-3">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(course.duration / 60)}h</span>
                                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.totalLessons || 12} lessons</span>
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrollmentCount > 1000 ? (course.enrollmentCount / 1000).toFixed(1) + 'k' : course.enrollmentCount}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg text-[var(--foreground)]">${course.price}</span>
                                    {course.compareAtPrice && (
                                        <span className="text-sm text-[var(--muted-foreground)] line-through">${course.compareAtPrice}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 px-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--muted)]/50">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-[var(--muted-foreground)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No courses found</h3>
                    <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                        We couldn't find any courses in this category yet.
                    </p>
                    <Button variant="outline" className="mt-6" asChild>
                        <Link href="/learn">
                            Browse all courses
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
