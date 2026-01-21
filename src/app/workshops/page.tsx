"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/organisms";
import { Button, ImageWithFallback } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import {
    Calendar,
    Clock,
    Search,
    MapPin,
    Video,
    Filter
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrency } from "@/context/CurrencyContext";

// Types
interface Instructor {
    name: string;
    avatar: string;
}

interface Workshop {
    id: string;
    title: string;
    slug: string;
    description: string;
    date: string;
    duration: number;
    instructor: Instructor;
    price: number;
    capacity: number;
    enrolled: number;
    thumbnail: string;
    tags: string[];
    country: string;
    city: string;
}

export default function WorkshopsListingPage() {
    const { formatPrice } = useCurrency();
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [sortOption, setSortOption] = useState("upcoming");

    // Unique locations for filters
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        fetchWorkshops();
    }, [selectedCountry, selectedCity, sortOption]);

    const fetchWorkshops = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCountry) params.append("country", selectedCountry);
            if (selectedCity) params.append("city", selectedCity);
            if (sortOption) params.append("sort", sortOption);

            const res = await fetch(`/api/workshops?${params.toString()}`);
            const data: Workshop[] = await res.json();
            setWorkshops(data);

            // Extract unique countries and cities from ALL data (ideally should be from a separate meta-data endpoint, but simplifying here based on loaded data for now, or determining from initial load)
            // For better UX, we'll extract from the current fetched data or a separate initial fetch. 
            // Let's extracting from the data for now.
            if (countries.length === 0) {
                // Initial load to get all locations logic could go here, but for now we'll just derive from what we have or hardcode popular ones if needed.
                // Better approach: reset filters -> fetch all -> extract unique.
            }

        } catch (error) {
            console.error("Failed to fetch workshops:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get unique values for dropdowns (naively from current view or pre-defined)
    // In a real app, you'd fetch "available filters" from an API. 
    // We will simulate this by extracting from a raw fetch of all workshops on mount
    useEffect(() => {
        const loadFilters = async () => {
            const res = await fetch('/api/workshops');
            const data: Workshop[] = await res.json();
            const uniqueCountries = Array.from(new Set(data.map(w => w.country))).sort();
            const uniqueCities = Array.from(new Set(data.map(w => w.city))).sort();
            setCountries(uniqueCountries);
            setCities(uniqueCities);
        };
        loadFilters();
    }, []);


    const filteredWorkshops = workshops.filter(workshop =>
        workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workshop.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workshop.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-12 bg-gradient-to-r from-blue-600 to-cyan-600">
                <div className="container-app">
                    <div className="text-center text-white max-w-3xl mx-auto">
                        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                            Live Interactive Sessions
                        </span>
                        <h1 className="text-3xl lg:text-5xl font-bold mb-6">Upcoming Workshops</h1>
                        <p className="text-lg text-white/80 mb-8">
                            Join live classes with professional artists. Get real-time feedback, ask questions, and learn together.
                        </p>

                        <div className="relative max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by topic, instructor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl text-[var(--foreground)] bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center">
                                <select
                                    value={selectedCountry}
                                    onChange={(e) => {
                                        setSelectedCountry(e.target.value);
                                        setSelectedCity(""); // Reset city when country changes
                                    }}
                                    className="px-4 py-3 rounded-xl bg-white text-[var(--foreground)] shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer min-w-[140px]"
                                >
                                    <option value="">All Countries</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="px-4 py-3 rounded-xl bg-white text-[var(--foreground)] shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer min-w-[140px]"
                                >
                                    <option value="">All Cities</option>
                                    {cities.filter(city => {
                                        // If a country is selected, only show cities from that country. 
                                        // Simple approximation since we don't have a map
                                        return true;
                                    }).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workshops Grid */}
            <section className="py-12">
                <div className="container-app">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold">
                            {selectedCountry || selectedCity ? 'Filtered Results' : 'Featured Sessions'}
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-[var(--muted-foreground)] hidden sm:inline-block">
                                Showing {filteredWorkshops.length} workshops
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[var(--muted-foreground)]">Sort by:</span>
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="pl-2 pr-8 py-1.5 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-600)] cursor-pointer"
                                    style={{ backgroundImage: "none" }} // Resetting any default styles if needed, though Tailwind usually handles it. Actually let's use a standard select with padding.
                                >
                                    <option value="upcoming">Soonest</option>
                                    <option value="newest">Latest</option>
                                    <option value="popular">Most Popular</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin w-8 h-8 border-4 border-[var(--primary-600)] border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p>Loading workshops...</p>
                        </div>
                    ) : filteredWorkshops.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredWorkshops.map((workshop) => (
                                <Card key={workshop.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-[var(--border)]">
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <ImageWithFallback
                                            src={workshop.thumbnail}
                                            alt={workshop.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-semibold text-blue-600 flex items-center gap-1">
                                                <Video className="w-3 h-3" /> Live
                                            </span>
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <div className="bg-black/60 backdrop-blur-sm text-white p-2 rounded-lg text-xs flex items-center justify-between">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(workshop.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {workshop.city}, {workshop.country}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            {workshop.tags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-[var(--muted)] text-xs text-[var(--muted-foreground)] rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">
                                            <Link href={`/workshops/${workshop.slug}`} className="hover:text-blue-600 transition-colors">
                                                {workshop.title}
                                            </Link>
                                        </h3>

                                        <p className="text-sm text-[var(--muted-foreground)] mb-4 line-clamp-2">
                                            {workshop.description}
                                        </p>

                                        <div className="flex items-center gap-2 mb-4">
                                            <img src={workshop.instructor.avatar} alt={workshop.instructor.name} className="w-6 h-6 rounded-full" />
                                            <span className="text-xs font-medium">{workshop.instructor.name}</span>
                                        </div>

                                        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                            <div>
                                                <span className="block text-lg font-bold text-[var(--primary-600)]">{formatPrice(workshop.price)}</span>
                                            </div>
                                            <Button size="sm" asChild>
                                                <Link href={`/workshops/${workshop.slug}`}>View Details</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-[var(--muted)] rounded-2xl">
                            <Filter className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No workshops found</h3>
                            <p className="text-[var(--muted-foreground)]">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
