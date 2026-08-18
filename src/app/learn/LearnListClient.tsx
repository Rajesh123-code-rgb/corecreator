"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header, Footer } from "@/components/organisms";
import { Button, ImageWithFallback } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import {
    Search,
    SlidersHorizontal,
    Star,
    Clock,
    Users,
    PlayCircle,
    BookOpen,
    Award,
    Loader2,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { fetchWithTimeout } from "@/lib/utils/fetchWithTimeout";

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
    averageRating: number;
    totalReviews: number;
    totalStudents: number;
    totalDuration: number; // in minutes
    totalLectures: number;
    level: string;
    isBestseller?: boolean;
    isFeatured?: boolean;
}

interface CategoryItem {
    _id: string;
    name: string;
    slug: string;
}

const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

export function LearnListClient({
    initialCourses,
    initialPagination,
}: {
    initialCourses: Course[];
    initialPagination: { page: number; limit: number; total: number; pages: number };
}) {
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const searchParams = useSearchParams();
    const { stats: liveStats } = usePlatformStats();

    // Query Params
    const categoryParam = searchParams.get("category") || "all";
    const levelParam = searchParams.get("level");
    const minRatingParam = searchParams.get("minRating");
    const pageParam = parseInt(searchParams.get("page") || "1");
    const searchParam = searchParams.get("search") || "";
    const sortParam = searchParams.get("sort") || "popular";

    // State
    const [courses, setCourses] = React.useState<Course[]>(initialCourses);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [totalPages, setTotalPages] = React.useState(initialPagination.pages);
    const [totalResults, setTotalResults] = React.useState(initialPagination.total);
    const [searchTerm, setSearchTerm] = React.useState(searchParam);
    const [courseCategories, setCourseCategories] = React.useState<CategoryItem[]>([]);

    // Fetch categories from database
    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetchWithTimeout("/api/categories?type=course");
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

    // Filters State (sync with params)
    const [selectedCategory, setSelectedCategory] = React.useState(categoryParam);
    const [selectedLevel, setSelectedLevel] = React.useState(levelParam || "All Levels");
    const [selectedRating, setSelectedRating] = React.useState(minRatingParam ? parseFloat(minRatingParam) : 0);

    const fetchCourses = React.useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams();
            if (categoryParam && categoryParam !== "all") params.set("category", categoryParam);
            if (levelParam && levelParam !== "All Levels") params.set("level", levelParam.toLowerCase());
            if (minRatingParam) params.set("minRating", minRatingParam);
            if (searchParam) params.set("search", searchParam);
            params.set("page", pageParam.toString());
            params.set("limit", "12");
            params.set("sort", sortParam);

            const res = await fetchWithTimeout(`/api/courses?${params.toString()}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();

            if (data.courses) {
                setCourses(data.courses);
                setTotalPages(data.pagination?.pages || 0);
                setTotalResults(data.pagination?.total || 0);
            }
        } catch (err) {
            console.error("Failed to fetch courses:", err);
            setError(true);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, [categoryParam, levelParam, minRatingParam, pageParam, searchParam, sortParam]);

    // The server already ran this exact query for the current searchParams and
    // passed the result in as props, so skip the first fetch and only refetch
    // when a filter actually changes afterwards.
    const isInitialRender = React.useRef(true);
    React.useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
        } else {
            fetchCourses();
        }
        setSelectedCategory(categoryParam);
    }, [fetchCourses, categoryParam]);

    // Handle Filter Changes
    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        // Reset page on filter change
        if (!updates.page) {
            params.set("page", "1");
        }
        router.push(`/learn?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateParams({ search: searchTerm });
    };

    const handleCategoryChange = (slug: string) => {
        setSelectedCategory(slug);
        updateParams({ category: slug === "all" ? null : slug });
    };

    const handleLevelChange = (level: string) => {
        setSelectedLevel(level);
        updateParams({ level: level === "All Levels" ? null : level });
    };

    const handleRatingChange = (rating: number) => {
        setSelectedRating(rating);
        updateParams({ minRating: rating.toString() });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateParams({ sort: e.target.value });
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`/learn?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />
            <main id="main-content">

            {/* Hero Section */}
            <section className="pt-24 pb-12 bg-gradient-to-r from-purple-600 to-indigo-700">
                <div className="container-app">
                    <div className="text-center text-white max-w-3xl mx-auto">
                        <h1 className="text-3xl lg:text-4xl font-bold mb-4">Learn Art & Craft from World-Class Creators</h1>
                        <p className="text-lg text-white/80 mb-8">Access courses taught by professional artists. Start learning today.</p>

                        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="What do you want to learn today?"
                                className="w-full pl-12 pr-4 py-4 rounded-xl text-[var(--foreground)] bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700">
                                Search
                            </Button>
                        </form>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center gap-8 lg:gap-16 mt-12 text-white">
                        <div className="text-center">
                            <p className="text-3xl font-bold">{liveStats.courses}+</p>
                            <p className="text-sm text-white/70">Courses</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold">{liveStats.learners}+</p>
                            <p className="text-sm text-white/70">Students</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold">{liveStats.creators}+</p>
                            <p className="text-sm text-white/70">Instructors</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8">
                <div className="container-app">
                    <div className="flex gap-8">
                        {/* Sidebar */}
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-6">
                                <div>
                                    <h3 className="font-semibold mb-3">Categories</h3>
                                    <ul className="space-y-1">
                                        <ul className="space-y-1">
                                            <li key="all">
                                                <button
                                                    onClick={() => handleCategoryChange("all")}
                                                    className={`w-full text-left flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-sm ${selectedCategory === "all" ? "bg-[var(--secondary-100)] text-[var(--secondary-700)] font-medium" : "hover:bg-[var(--muted)]"}`}
                                                >
                                                    <span>All Courses</span>
                                                </button>
                                            </li>
                                            {courseCategories.map((cat) => {
                                                const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase() || selectedCategory.toLowerCase() === cat.name.toLowerCase();
                                                return (
                                                    <li key={cat._id}>
                                                        <button
                                                            onClick={() => handleCategoryChange(cat.slug)}
                                                            className={`w-full text-left flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-sm ${isActive ? "bg-[var(--secondary-100)] text-[var(--secondary-700)] font-medium" : "hover:bg-[var(--muted)]"}`}
                                                        >
                                                            <span>{cat.name}</span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Level</h3>
                                    <div className="space-y-2">
                                        {levels.map((level) => (
                                            <label key={level} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="level"
                                                    checked={selectedLevel === level.toLowerCase() || (level === "All Levels" && !levelParam)}
                                                    onChange={() => handleLevelChange(level === "All Levels" ? "all" : level.toLowerCase())}
                                                    className="rounded border-[var(--border)]"
                                                />
                                                <span className="text-sm">{level}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Rating</h3>
                                    <div className="space-y-2">
                                        {[4.5, 4.0, 3.5].map((rating) => (
                                            <label key={rating} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="rating"
                                                    checked={selectedRating === rating}
                                                    onChange={() => handleRatingChange(rating)}
                                                    className="rounded-full border-[var(--border)]"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    <span className="text-sm">{rating}+ rating</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Course Grid */}
                        {/* min-w-0 for the same reason as the marketplace column:
                            without it this cannot shrink below the card grid's
                            min-content width. */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Showing <strong>{courses.length > 0 ? (pageParam - 1) * 12 + 1 : 0}-{Math.min(pageParam * 12, totalResults)}</strong> of <strong>{totalResults}</strong> courses
                                </p>
                                <div className="flex items-center gap-3">
                                    <button className="lg:hidden p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]">
                                        <SlidersHorizontal className="w-5 h-5" />
                                    </button>
                                    <select
                                        value={sortParam}
                                        onChange={handleSortChange}
                                        className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
                                    >
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="newest">Newest</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-700)]" />
                                </div>
                            ) : error ? (
                                <div className="text-center py-16 bg-red-50/50 border border-red-200 rounded-2xl">
                                    <BookOpen className="w-12 h-12 mx-auto text-red-500 mb-3" />
                                    <h3 className="text-lg font-semibold text-red-700">Unable to load courses</h3>
                                    <p className="text-red-600/80 text-sm mt-1 mb-4">There was an issue connecting to the server. Please check your connection and try again.</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => fetchCourses()}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            ) : courses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {courses.map((course) => (
                                        <Card key={course._id} hover className="group overflow-hidden">
                                            <div className="relative aspect-video overflow-hidden">
                                                <ImageWithFallback src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                                                        <span className="text-sm font-medium">{(course.averageRating || 0).toFixed(1)}</span>
                                                    </div>
                                                    <span className="text-xs text-[var(--muted-foreground)]">({(course.totalReviews || 0).toLocaleString()})</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] mb-3">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(course.totalDuration / 60)}h</span>
                                                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.totalLectures || 12} lessons</span>
                                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.totalStudents > 1000 ? (course.totalStudents / 1000).toFixed(1) + 'k' : course.totalStudents}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg">{formatPrice(course.price)}</span>
                                                    {course.compareAtPrice && (
                                                        <span className="text-sm text-[var(--muted-foreground)] line-through">{formatPrice(course.compareAtPrice)}</span>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-gray-50 rounded-lg">
                                    <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
                                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => updateParams({ category: null, level: null, minRating: null, search: null })}
                                    >
                                        Clear all filters
                                    </Button>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pageParam === 1}
                                        onClick={() => handlePageChange(pageParam - 1)}
                                    >
                                        Previous
                                    </Button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === pageParam ? "bg-purple-600 text-white" : "hover:bg-[var(--muted)]"}`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pageParam === totalPages}
                                        onClick={() => handlePageChange(pageParam + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            </main>
            <Footer />
        </div>
    );
}
