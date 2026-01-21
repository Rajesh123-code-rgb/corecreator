"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Loader2, BookOpen, ShoppingBag, Calendar, ArrowRight } from "lucide-react";

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

interface SearchBarProps {
    placeholder?: string;
    className?: string;
}

export function SearchBar({ placeholder = "Search courses, artworks, workshops...", className = "" }: SearchBarProps) {
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [counts, setCounts] = React.useState<{ products: number; courses: number; workshops: number } | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    // Handle click outside to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    const handleSearch = React.useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            setCounts(null);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all&limit=12`);
            const data = await response.json();
            setResults(data.results || []);
            setCounts(data.counts || null);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(value), 300);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
        }
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setCounts(null);
        inputRef.current?.focus();
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

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-[var(--secondary-300)] focus:ring-2 focus:ring-[var(--secondary-100)] transition-all"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </form>

            {/* Dropdown Results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--secondary-500)]" />
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {/* Results */}
                            <div className="divide-y divide-gray-100">
                                {results.map((result) => (
                                    <Link
                                        key={`${result.type}-${result.id}`}
                                        href={getResultLink(result)}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        {result.image ? (
                                            <img
                                                src={result.image}
                                                alt={result.title}
                                                className="w-12 h-12 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                {getTypeIcon(result.type)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                    {getTypeLabel(result.type)}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900 truncate mt-1">{result.title}</p>
                                            {result.description && (
                                                <p className="text-sm text-gray-500 truncate">{result.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-[var(--secondary-600)]">
                                                ${result.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* View All Results */}
                            <div className="p-4 bg-gray-50 border-t">
                                <Link
                                    href={`/search?q=${encodeURIComponent(query)}`}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 text-[var(--secondary-600)] hover:text-[var(--secondary-700)] font-medium"
                                >
                                    View all results
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-center">
                            <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
                            <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
