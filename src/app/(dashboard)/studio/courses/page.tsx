"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import {
    Plus, Search, MoreVertical, BookOpen, Users, Star, Loader2,
    Calendar, Edit3, Eye, DollarSign, FileText, LayoutList, TrendingUp
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface Course {
    id: string;
    title: string;
    status: string;
    students: number;
    rating: number;
    price: number;
    currency?: "USD" | "INR" | "EUR" | "GBP";
    thumbnail: string;
    slug: string;
    updatedAt: string;
    lectures: number;
}

export default function CoursesPage() {
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("");
    const { formatPrice } = useCurrency();

    React.useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (searchQuery) params.append("search", searchQuery);
                if (statusFilter) params.append("status", statusFilter);

                const res = await fetch(`/api/studio/courses?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses || []);
                }
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchCourses, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, statusFilter]);

    if (loading && courses.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">My Courses</h1>
                    <p className="text-[var(--muted-foreground)] mt-1">Manage, edit, and track your content</p>
                </div>
                <Button asChild className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
                    <Link href="/studio/courses/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Course
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <Input
                        className="pl-10 h-10 bg-gray-50 border-transparent focus:bg-white transition-all"
                        placeholder="Search your courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="h-10 px-4 rounded-lg border border-transparent bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:bg-white transition-all min-w-[150px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-600)]" />
                    </div>
                ) : courses.length === 0 ? (
                    <Card className="py-16 text-center border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-[var(--muted-foreground)]" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                        <p className="text-[var(--muted-foreground)] mb-6 max-w-sm mx-auto">
                            {searchQuery || statusFilter
                                ? "Try adjusting your search or filters to find what you're looking for."
                                : "Get started by creating your first course and sharing your knowledge."}
                        </p>
                        {!searchQuery && !statusFilter && (
                            <Button asChild variant="outline">
                                <Link href="/studio/courses/new">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Course
                                </Link>
                            </Button>
                        )}
                    </Card>
                ) : (
                    courses.map((course) => (
                        <div
                            key={course.id}
                            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[var(--primary-200)] hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex flex-col md:flex-row gap-6 p-5">
                                {/* Thumbnail Section */}
                                <div className="md:w-72 md:h-40 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100 group-hover:scale-[1.02] transition-transform duration-500">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm backdrop-blur-md ${course.status === "published"
                                            ? "bg-green-500/90 text-white"
                                            : course.status === "rejected"
                                                ? "bg-red-500/90 text-white"
                                                : "bg-gray-500/90 text-white"
                                            }`}>
                                            {course.status === "published" ? "Published" : course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                                        </span>
                                        {course.status === "draft" && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm backdrop-blur-md bg-white/90 text-gray-700">
                                                <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                                                {Math.min(100, (course.lectures > 0 ? 20 : 0) + (course.price > 0 ? 20 : 0) + (course.thumbnail ? 20 : 0) + (course.title ? 20 : 0) + (course.lectures > 3 ? 20 : 0))}% Ready
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[var(--primary-600)] transition-colors line-clamp-1 mb-2">
                                                {course.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--muted-foreground)]">
                                                <div className="flex items-center gap-1.5">
                                                    <LayoutList className="w-4 h-4" />
                                                    <span>{course.lectures || 0} lectures</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4" />
                                                    <span>{course.students} students</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    <span>{course.rating || "New"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 ">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-lg font-bold text-gray-900 block">
                                                {formatPrice(course.price, course.currency || "INR")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100">
                                        <Button asChild size="sm" className="h-9">
                                            <Link href={`/studio/courses/${course.id}/edit`}>
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Edit Course
                                            </Link>
                                        </Button>

                                        <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                                            <Link
                                                href={`/studio/courses/${course.id}/curriculum`}
                                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[var(--primary-600)] hover:bg-[var(--primary-50)] rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                Curriculum
                                            </Link>
                                            <Link
                                                href={`/studio/courses/${course.id}/pricing`}
                                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[var(--primary-600)] hover:bg-[var(--primary-50)] rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                <DollarSign className="w-4 h-4 mr-2" />
                                                Pricing
                                            </Link>
                                            <Link
                                                href={`/learn/${course.slug}`}
                                                target="_blank"
                                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[var(--primary-600)] hover:bg-[var(--primary-50)] rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Preview
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={`w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${className}`}
            {...props}
        />
    );
}
