import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Search, Calendar, User, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

const categories = ["All", "Art Tips", "Platform Updates", "Creator Stories", "Industry Insights"];

const posts = [
    {
        title: "10 Essential Tips for Beginning Watercolor Artists",
        excerpt: "Start your watercolor journey on the right foot with these fundamental techniques and material recommendations.",
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop",
        author: "Sarah Mitchell",
        date: "Jan 12, 2026",
        category: "Art Tips",
        slug: "essential-tips-watercolor"
    },
    {
        title: "Introducing New Studio Tools for Sellers",
        excerpt: "We've vastly improved the analytics dashboard and added new inventory management features for all studio accounts.",
        image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=600&h=400&fit=crop",
        author: "Core Creator Team",
        date: "Jan 5, 2026",
        category: "Platform Updates",
        slug: "studio-tools-update"
    },
    {
        title: "How Michael Chen Built a Full-Time Career Selling Oil Paintings",
        excerpt: "An exclusive interview with one of our top sellers on how he grew his collector base and priced his work.",
        image: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&h=400&fit=crop",
        author: "Emma Rodriguez",
        date: "Dec 28, 2025",
        category: "Creator Stories",
        slug: "michael-chen-story"
    },
    {
        title: "The State of the Online Art Market in 2026",
        excerpt: "Trends, predictions, and what every digital artist needs to know about the current landscape.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
        author: "David Kim",
        date: "Dec 15, 2025",
        category: "Industry Insights",
        slug: "art-market-trends-2026"
    }
];

export default function BlogPage() {
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
                        {categories.map((cat, i) => (
                            <button
                                key={i}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? "bg-[var(--primary-600)] text-white" : "bg-[var(--secondary-100)] text-[var(--secondary-700)] hover:bg-[var(--secondary-200)]"}`}
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, i) => (
                            <Link href={`/blog/${post.slug}`} key={i} className="group block bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary-500)] transition-all hover:shadow-lg">
                                <div className="relative aspect-video overflow-hidden">
                                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded-full text-[var(--foreground)]">
                                        {post.category}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mb-3">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-[var(--primary-600)] transition-colors line-clamp-2">{post.title}</h3>
                                    <p className="text-[var(--muted-foreground)] text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                                    <div className="flex items-center text-[var(--primary-600)] font-medium text-sm mt-auto">
                                        Read Article <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <Button variant="outline" size="lg">Load More Articles</Button>
                    </div>
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
