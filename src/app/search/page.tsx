"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import {
    Search,
    Filter,
    Star,
    BookOpen,
    ShoppingBag,
    Calendar,
    Loader2,
    X,
    ChevronDown,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface SearchResult {
    type: "product" | "course" | "workshop";
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    slug: string;
    category: string;
    rating?: number;
}

const categories = [
    "All Categories",
    "Painting",
    "Drawing",
    "Sculpture",
    "Digital Art",
    "Photography",
    "Ceramics",
    "Textiles",
];

const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
];

export default function SearchPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--secondary-500)] border-t-transparent rounded-full" />
            </div>
        }>
            <SearchContent />
        </React.Suspense>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const { formatPrice } = useCurrency();
    const initialQuery = searchParams.get("q") || "";
    const initialType = searchParams.get("type") || "all";

    const [query, setQuery] = React.useState(initialQuery);
    const [activeType, setActiveType] = React.useState(initialType);
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(0);
    const [totalResults, setTotalResults] = React.useState(0);
    const [selectedCategory, setSelectedCategory] = React.useState("All Categories");
    const [sortBy, setSortBy] = React.useState("relevance");
    const [priceRange, setPriceRange] = React.useState({ min: "", max: "" });
    const [showFilters, setShowFilters] = React.useState(false);

    const fetchResults = React.useCallback(async () => {
        if (!query || query.length < 2) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                q: query,
                type: activeType,
                page: page.toString(),
                limit: "12",
                sort: sortBy,
            });

            if (selectedCategory !== "All Categories") {
                params.set("category", selectedCategory.toLowerCase());
            }
            if (priceRange.min) params.set("minPrice", priceRange.min);
            if (priceRange.max) params.set("maxPrice", priceRange.max);

            const response = await fetch(`/api/search?${params.toString()}`);
            const data = await response.json();

            setResults(data.results || []);
            setTotalPages(data.pagination?.pages || 0);
            setTotalResults(data.pagination?.total || 0);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [query, activeType, page, sortBy, selectedCategory, priceRange]);

    React.useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    React.useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchResults();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "course": return <BookOpen className="w-4 h-4" />;
            case "product": return <ShoppingBag className="w-4 h-4" />;
            case "workshop": return <Calendar className="w-4 h-4" />;
            default: return null;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "course": return "Course";
            case "product": return "Artwork";
            case "workshop": return "Workshop";
            default: return type;
        }
    };

    const getResultLink = (result: SearchResult) => {
        switch (result.type) {
            case "course": return `/learn/${result.slug}`;
            case "product": return `/marketplace/${result.slug}`;
            case "workshop": return `/workshops/${result.slug}`;
            default: return "#";
        }
    };

    const typeFilters = [
        { id: "all", label: "All", icon: Search },
        { id: "courses", label: "Courses", icon: BookOpen },
        { id: "products", label: "Artworks", icon: ShoppingBag },
        { id: "workshops", label: "Workshops", icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <main className="pt-20 pb-16">
                {/* Search Header */}
                <section className="bg-gradient-to-r from-purple-600 to-indigo-700 py-12">
                    <div className="container-app">
                        <h1 className="text-3xl font-bold text-white mb-6">Search Results</h1>
                        <form onSubmit={handleSearch} className="max-w-2xl">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search courses, artworks, workshops..."
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-white/50"
                                    />
                                </div>
                                <Button type="submit" size="lg">
                                    Search
                                </Button>
                            </div>
                        </form>
                    </div>
                </section>

                <div className="container-app py-8">
                    <div className="flex gap-8">
                        {/* Sidebar Filters */}
                        <aside className={`${showFilters ? "block" : "hidden"} lg:block w-64 flex-shrink-0`}>
                            <Card className="p-4 sticky top-24">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">Filters</h3>
                                    <button
                                        onClick={() => {
                                            setSelectedCategory("All Categories");
                                            setPriceRange({ min: "", max: "" });
                                        }}
                                        className="text-sm text-[var(--secondary-600)] hover:underline"
                                    >
                                        Clear all
                                    </button>
                                </div>

                                {/* Category Filter */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium mb-3">Category</h4>
                                    <div className="space-y-2">
                                        {categories.map((cat) => (
                                            <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    checked={selectedCategory === cat}
                                                    onChange={() => {
                                                        setSelectedCategory(cat);
                                                        setPage(1);
                                                    }}
                                                    className="text-[var(--secondary-600)]"
                                                />
                                                <span className="text-sm">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium mb-3">Price Range</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={priceRange.min}
                                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border rounded-lg"
                                        />
                                        <span className="text-gray-400 self-center">-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={priceRange.max}
                                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border rounded-lg"
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full mt-2"
                                        onClick={() => {
                                            setPage(1);
                                            fetchResults();
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </Card>
                        </aside>

                        {/* Results */}
                        <div className="flex-1">
                            {/* Type Tabs & Sort */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="flex gap-2">
                                    {typeFilters.map((filter) => (
                                        <button
                                            key={filter.id}
                                            onClick={() => {
                                                setActiveType(filter.id);
                                                setPage(1);
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeType === filter.id
                                                ? "bg-[var(--secondary-600)] text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                        >
                                            <filter.icon className="w-4 h-4" />
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="lg:hidden flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filters
                                    </button>

                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value);
                                            setPage(1);
                                        }}
                                        className="px-3 py-2 border rounded-lg text-sm"
                                    >
                                        {sortOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Results Count */}
                            {query && (
                                <p className="text-gray-600 mb-4">
                                    {totalResults} results for &quot;{query}&quot;
                                </p>
                            )}

                            {/* Results Grid */}
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-500)]" />
                                </div>
                            ) : results.length > 0 ? (
                                <>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {results.map((result) => (
                                            <Link key={`${result.type}-${result.id}`} href={getResultLink(result)}>
                                                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                                                    <div className="aspect-[4/3] relative">
                                                        {result.image ? (
                                                            <img
                                                                src={result.image}
                                                                alt={result.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                                {getTypeIcon(result.type)}
                                                            </div>
                                                        )}
                                                        <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 rounded-full text-xs font-medium flex items-center gap-1">
                                                            {getTypeIcon(result.type)}
                                                            {getTypeLabel(result.type)}
                                                        </span>
                                                    </div>
                                                    <div className="p-4">
                                                        <p className="text-xs text-gray-500 mb-1">{result.category}</p>
                                                        <h3 className="font-semibold line-clamp-2 mb-2">{result.title}</h3>
                                                        {result.description && (
                                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                                {result.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-[var(--secondary-600)]">
                                                                {formatPrice(result.price)}
                                                            </span>
                                                            {result.rating !== undefined && result.rating > 0 && (
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                    <span>{result.rating.toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-center gap-2 mt-8">
                                            <Button
                                                variant="outline"
                                                onClick={() => setPage(page - 1)}
                                                disabled={page === 1}
                                            >
                                                Previous
                                            </Button>
                                            <span className="flex items-center px-4">
                                                Page {page} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                onClick={() => setPage(page + 1)}
                                                disabled={page === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : query ? (
                                <div className="text-center py-16">
                                    <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                    <p className="text-gray-500">
                                        We couldn&apos;t find anything matching &quot;{query}&quot;
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Try different keywords or browse our categories
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">Start searching</h3>
                                    <p className="text-gray-500">
                                        Enter a search term to find courses, artworks, and workshops
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
