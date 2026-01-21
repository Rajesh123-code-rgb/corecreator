"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card } from "@/components/molecules";
import { Header, Footer } from "@/components/organisms";
import {
    Palette, Star, Search, Loader2, GraduationCap, ShoppingBag,
    SlidersHorizontal, Grid3X3, List, ArrowUpDown, Users, Award, X
} from "lucide-react";

interface Artist {
    id: string;
    name: string;
    avatar: string;
    specialty: string;
    courses: number;
    products: number;
    rating: number;
}

const SPECIALTIES = [
    "All Specialties",
    "Watercolor",
    "Oil Painting",
    "Digital Art",
    "Ceramics",
    "Sculpture",
    "Photography",
    "Calligraphy",
    "Textile Art",
    "Mixed Media",
];

const SORT_OPTIONS = [
    { value: "rating", label: "Highest Rated" },
    { value: "courses", label: "Most Courses" },
    { value: "products", label: "Most Artworks" },
    { value: "name", label: "Name (A-Z)" },
];

export default function ArtistsPage() {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("rating");
    const [specialty, setSpecialty] = useState("All Specialties");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/artists?limit=50&sort=${sortBy}`);
                if (res.ok) {
                    const data = await res.json();
                    setArtists(data.artists || []);
                }
            } catch (error) {
                console.error("Failed to fetch artists:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchArtists();
    }, [sortBy]);

    // Client-side filtering
    const filteredArtists = artists.filter(artist => {
        const matchesSearch =
            artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            artist.specialty.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSpecialty =
            specialty === "All Specialties" ||
            artist.specialty.toLowerCase().includes(specialty.toLowerCase());

        return matchesSearch && matchesSpecialty;
    });

    // Client-side sorting for name (API handles others)
    const sortedArtists = [...filteredArtists].sort((a, b) => {
        if (sortBy === "name") {
            return a.name.localeCompare(b.name);
        }
        return 0; // API already sorts by other criteria
    });

    const activeFiltersCount = (specialty !== "All Specialties" ? 1 : 0) + (searchQuery ? 1 : 0);

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-8 bg-gradient-to-b from-[var(--muted)] to-white">
                <div className="container-app text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                        Featured <span className="text-gradient">Artists</span>
                    </h1>
                    <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8">
                        Discover and learn from talented creators who share their craft on Core Creator.
                    </p>

                    {/* Stats */}
                    <div className="flex justify-center gap-8 mb-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[var(--secondary-600)]">{artists.length}+</div>
                            <div className="text-sm text-[var(--muted-foreground)]">Artists</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[var(--secondary-600)]">
                                {artists.reduce((sum, a) => sum + a.courses, 0)}+
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">Courses</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[var(--secondary-600)]">
                                {artists.reduce((sum, a) => sum + a.products, 0)}+
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">Artworks</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filters Bar */}
            <section className="sticky top-16 z-40 bg-white border-b border-[var(--border)] shadow-sm">
                <div className="container-app py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                            <input
                                type="text"
                                placeholder="Search artists..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-500)] text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-4 h-4 text-[var(--muted-foreground)]" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            {/* Specialty Filter */}
                            <select
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white text-sm min-w-[160px]"
                            >
                                {SPECIALTIES.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white text-sm min-w-[150px]"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

                            {/* View Toggle */}
                            <div className="hidden sm:flex border border-[var(--border)] rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2.5 ${viewMode === "grid" ? "bg-[var(--secondary-100)] text-[var(--secondary-600)]" : "bg-white text-[var(--muted-foreground)]"}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2.5 ${viewMode === "list" ? "bg-[var(--secondary-100)] text-[var(--secondary-600)]" : "bg-white text-[var(--muted-foreground)]"}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Results Count */}
                            <span className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                                {sortedArtists.length} artists
                            </span>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-[var(--muted-foreground)]">Filters:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--secondary-100)] text-[var(--secondary-700)] rounded-full text-xs">
                                    Search: {searchQuery}
                                    <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {specialty !== "All Specialties" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--secondary-100)] text-[var(--secondary-700)] rounded-full text-xs">
                                    {specialty}
                                    <button onClick={() => setSpecialty("All Specialties")}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            <button
                                onClick={() => { setSearchQuery(""); setSpecialty("All Specialties"); }}
                                className="text-xs text-[var(--secondary-600)] hover:underline"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Artists Grid/List */}
            <section className="py-12 bg-[var(--muted)] min-h-[50vh]">
                <div className="container-app">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-[var(--secondary-500)]" />
                        </div>
                    ) : sortedArtists.length > 0 ? (
                        viewMode === "grid" ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {sortedArtists.map((artist, index) => (
                                    <Link key={artist.id} href={`/artists/${artist.id}`}>
                                        <Card hover className="p-6 text-center cursor-pointer h-full animate-fade-in-up" style={{ animationDelay: `${index * 0.03}s` }}>
                                            <div className="relative inline-block mb-4">
                                                <img
                                                    src={artist.avatar}
                                                    alt={artist.name}
                                                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--secondary-500)] rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                                                    ✓
                                                </div>
                                            </div>
                                            <h3 className="font-semibold text-lg mb-1">{artist.name}</h3>
                                            <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-1">{artist.specialty}</p>

                                            <div className="flex justify-center gap-3 text-xs text-[var(--muted-foreground)] mb-3">
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="w-3 h-3" />
                                                    {artist.courses}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ShoppingBag className="w-3 h-3" />
                                                    {artist.products}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-center gap-1">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span className="font-semibold">{artist.rating}</span>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sortedArtists.map((artist, index) => (
                                    <Link key={artist.id} href={`/artists/${artist.id}`}>
                                        <Card hover className="p-4 cursor-pointer animate-fade-in-up" style={{ animationDelay: `${index * 0.02}s` }}>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img
                                                        src={artist.avatar}
                                                        alt={artist.name}
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--secondary-500)] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                                        ✓
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg">{artist.name}</h3>
                                                    <p className="text-sm text-[var(--muted-foreground)]">{artist.specialty}</p>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="text-center">
                                                        <div className="font-bold">{artist.courses}</div>
                                                        <div className="text-xs text-[var(--muted-foreground)]">Courses</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-bold">{artist.products}</div>
                                                        <div className="text-xs text-[var(--muted-foreground)]">Artworks</div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        <span className="font-semibold">{artist.rating}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-20">
                            <Palette className="w-16 h-16 mx-auto mb-6 text-[var(--secondary-400)]" />
                            <h2 className="text-2xl font-bold mb-4">
                                {searchQuery || specialty !== "All Specialties" ? "No Artists Found" : "No Artists Yet"}
                            </h2>
                            <p className="max-w-md mx-auto mb-8 text-[var(--muted-foreground)]">
                                {searchQuery || specialty !== "All Specialties"
                                    ? "Try adjusting your search or filters."
                                    : "Be the first to become a creator on Core Creator!"}
                            </p>
                            {(searchQuery || specialty !== "All Specialties") ? (
                                <Button onClick={() => { setSearchQuery(""); setSpecialty("All Specialties"); }}>
                                    Clear Filters
                                </Button>
                            ) : (
                                <Button size="lg" asChild>
                                    <Link href="/studio/register">Become a Creator</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
