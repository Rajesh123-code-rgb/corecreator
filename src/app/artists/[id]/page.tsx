"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/organisms";
import { Card, CardContent } from "@/components/molecules";
import { Button } from "@/components/atoms";
import { Star, GraduationCap, ShoppingBag, Award, ArrowLeft, Loader2, Play } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface Artist {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    specialty: string;
    rating: number;
    courses: Course[];
    products: Product[];
    totalStudents: number;
}

interface Course {
    _id: string;
    title: string;
    slug: string;
    thumbnail: string;
    price: number;
    rating: number;
    enrollmentCount: number;
    level: string;
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: { url: string }[];
    category: string;
}

export default function ArtistProfilePage() {
    const params = useParams();
    const artistId = params.id as string;
    const { formatPrice } = useCurrency();

    const [artist, setArtist] = useState<Artist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/artists/${artistId}`);
                if (!res.ok) {
                    throw new Error("Artist not found");
                }
                const data = await res.json();
                setArtist(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load artist");
            } finally {
                setLoading(false);
            }
        };

        if (artistId) {
            fetchArtist();
        }
    }, [artistId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Header />
                <div className="flex justify-center items-center py-40">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--secondary-500)]" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Header />
                <div className="container-app py-20 text-center">
                    <h1 className="text-2xl font-bold mb-4">Artist Not Found</h1>
                    <p className="text-[var(--muted-foreground)] mb-6">{error || "The artist you're looking for doesn't exist."}</p>
                    <Button asChild>
                        <Link href="/artists"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-[var(--muted)] to-white pt-24 pb-12">
                <div className="container-app">
                    <Link href="/artists" className="inline-flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Artists
                    </Link>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="relative">
                            <img
                                src={artist.avatar}
                                alt={artist.name}
                                className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl"
                            />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[var(--secondary-500)] rounded-full flex items-center justify-center text-white font-bold shadow">
                                ✓
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold mb-2">{artist.name}</h1>
                            <p className="text-[var(--secondary-600)] font-medium mb-3">{artist.specialty}</p>
                            <p className="text-[var(--muted-foreground)] max-w-2xl mb-4">{artist.bio}</p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-6">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    <span className="font-bold">{artist.rating}</span>
                                    <span className="text-[var(--muted-foreground)]">Rating</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-blue-500" />
                                    <span className="font-bold">{artist.courses?.length || 0}</span>
                                    <span className="text-[var(--muted-foreground)]">Courses</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-emerald-500" />
                                    <span className="font-bold">{artist.products?.length || 0}</span>
                                    <span className="text-[var(--muted-foreground)]">Artworks</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-purple-500" />
                                    <span className="font-bold">{artist.totalStudents?.toLocaleString() || 0}</span>
                                    <span className="text-[var(--muted-foreground)]">Students</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Courses Section */}
            {artist.courses && artist.courses.length > 0 && (
                <section className="py-12">
                    <div className="container-app">
                        <h2 className="text-2xl font-bold mb-6">Courses by {artist.name}</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {artist.courses.map((course) => (
                                <Card key={course._id} hover className="overflow-hidden group">
                                    <div className="relative aspect-video">
                                        <img
                                            src={course.thumbnail || "https://placehold.co/600x400?text=Course"}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <Link href={`/learn/${course.slug}`} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="w-12 h-12 text-white fill-current" />
                                        </Link>
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded capitalize">
                                            {course.level}
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2 text-xs text-[var(--muted-foreground)]">
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {course.rating?.toFixed(1) || "New"}</span>
                                            <span>•</span>
                                            <span>{course.enrollmentCount?.toLocaleString() || 0} students</span>
                                        </div>
                                        <Link href={`/learn/${course.slug}`} className="hover:text-[var(--secondary-600)]">
                                            <h3 className="font-bold mb-2 line-clamp-2">{course.title}</h3>
                                        </Link>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-lg">{formatPrice(course.price)}</span>
                                            <Button size="sm" variant="secondary" asChild>
                                                <Link href={`/learn/${course.slug}`}>View Course</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Products Section */}
            {artist.products && artist.products.length > 0 && (
                <section className="py-12 bg-[var(--muted)]">
                    <div className="container-app">
                        <h2 className="text-2xl font-bold mb-6">Artworks by {artist.name}</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {artist.products.map((product) => (
                                <Card key={product._id} hover className="overflow-hidden">
                                    <div className="relative aspect-square">
                                        <Link href={`/marketplace/${product.slug}`}>
                                            <img
                                                src={product.images?.[0]?.url || "https://placehold.co/400x400?text=Artwork"}
                                                alt={product.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        </Link>
                                    </div>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-[var(--muted-foreground)] mb-1">{product.category}</p>
                                        <Link href={`/marketplace/${product.slug}`} className="hover:text-[var(--secondary-600)]">
                                            <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                                        </Link>
                                        <span className="text-lg font-bold text-[var(--secondary-600)] mt-2 block">{formatPrice(product.price)}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}
