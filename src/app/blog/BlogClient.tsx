"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Search, Calendar, User, ArrowRight, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/utils/fetchWithTimeout";

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    coverImage: string;
    author: {
        name: string;
        image?: string;
    };
    tags: string[];
    publishedAt: string;
}

const categories = ["All", "Art Tips", "Platform Updates", "Creator Stories", "Industry Insights"];

export default function BlogClient() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchPosts = async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
                setError(false);
            } else {
                setLoadingMore(true);
            }

            const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: "12",
            });

            if (selectedCategory !== "All") {
                params.append("category", selectedCategory);
            }

            if (searchQuery) {
                params.append("search", searchQuery);
            }

            const res = await fetchWithTimeout(`/api/posts?${params}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();

            if (append) {
                setPosts((prev) => [...prev, ...(data.posts || [])]);
            } else {
                setPosts(data.posts || []);
            }
            setHasMore(pageNum < (data.pagination?.totalPages || 0));
        } catch (err) {
            console.error("Failed to fetch posts:", err);
            if (pageNum === 1) {
                setError(true);
                setPosts([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchPosts(1, false);
    }, [selectedCategory, searchQuery]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero */}
            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">Core Creator <span className="text-gradient">Blog</span></h1>
                        <p className="text-lg text-[var(--muted-foreground)] mb-8">
                            Insights, updates, and inspiration for the global art community.
                        </p>
                        <div className="relative max-w-lg">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-8 border-b border-[var(--border)] sticky top-0 bg-[var(--background)] z-10">
                <div className="container-app overflow-x-auto">
                    <div className="flex gap-4">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                        ? "bg-[var(--primary-600)] text-white"
                                        : "bg-[var(--secondary-100)] text-[var(--secondary-700)] hover:bg-[var(--secondary-200)]"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="py-20">
                <div className="container-app">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-500)]" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
                            <Calendar className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Unable to load articles</h3>
                            <p className="text-red-600/80 dark:text-red-300 text-sm mt-1 mb-4">There was an issue connecting to the server. Please try again.</p>
                            <Button variant="outline" onClick={() => fetchPosts(1, false)}>
                                Try Again
                            </Button>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                            <p className="text-[var(--muted-foreground)]">
                                {searchQuery
                                    ? "Try a different search term"
                                    : "Check back soon for new content!"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((post) => (
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        key={post._id}
                                        className="group block bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary-500)] transition-all hover:shadow-lg"
                                    >
                                        <div className="relative aspect-video overflow-hidden">
                                            <img
                                                src={post.coverImage || "https://placehold.co/600x400?text=Blog+Post"}
                                                alt={post.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            {post.tags?.[0] && (
                                                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded-full text-[var(--foreground)]">
                                                    {post.tags[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {formatDate(post.publishedAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {post.author.name}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--primary-600)] transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>
                                            {post.excerpt && (
                                                <p className="text-[var(--muted-foreground)] text-sm mb-4 line-clamp-3">
                                                    {post.excerpt}
                                                </p>
                                            )}
                                            <div className="flex items-center text-[var(--primary-600)] font-medium text-sm mt-auto">
                                                Read Article <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {hasMore && (
                                <div className="mt-16 text-center">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            "Load More Articles"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-20 bg-[var(--card)] border-t border-[var(--border)]">
                <div className="container-app">
                    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Subscribe to our newsletter</h2>
                            <p className="text-purple-100 mb-8">
                                Get the latest articles, tutorials, and marketplace trends delivered straight to your inbox.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-white/50 text-gray-900"
                                />
                                <Button className="bg-white text-purple-900 hover:bg-purple-100">Subscribe</Button>
                            </div>
                            <p className="text-xs text-purple-300 mt-4">
                                No spam, unsubscribe at any time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
