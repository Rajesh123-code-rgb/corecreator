import Link from "next/link";
import { Header, Footer } from "@/components/organisms";
import { ArrowRight, Search } from "lucide-react";
import { courseCategories } from "@/lib/courseCategories";

export default function CourseCategoriesPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-[var(--muted)]">
                <div className="container-app relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Browse Course <span className="text-gradient">Categories</span></h1>
                        <p className="text-lg text-[var(--muted-foreground)] mb-8">
                            Explore our extensive library of art and craft courses.
                            Find the perfect topic to start your learning journey.
                        </p>

                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                            <input
                                type="text"
                                placeholder="Search for a topic..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                            />
                        </div>
                    </div>
                </div>

                {/* Background Elements */}
                <div className="absolute top-20 left-[-5%] w-64 h-64 rounded-full bg-purple-200 blur-3xl opacity-30 pointer-events-none" />
                <div className="absolute bottom-10 right-[-5%] w-80 h-80 rounded-full bg-indigo-200 blur-3xl opacity-30 pointer-events-none" />
            </section>

            {/* Categories Grid */}
            <section className="py-20">
                <div className="container-app">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courseCategories.map((category, index) => (
                            <Link
                                key={category.slug}
                                href={`/learn/categories/${category.slug}`}
                                className="group relative rounded-2xl overflow-hidden aspect-[4/3] block bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="absolute inset-0">
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-white">{category.name}</h3>
                                        <span className="px-2 py-1 rounded-md bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                                            {category.count}
                                        </span>
                                    </div>
                                    <p className="text-white/80 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                        {category.description}
                                    </p>
                                    <div className="flex items-center text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                                        View Courses <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
