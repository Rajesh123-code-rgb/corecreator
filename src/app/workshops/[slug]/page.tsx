"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/organisms";
import { Button, ImageWithFallback } from "@/components/atoms";
import { Card, CardContent, EnquiryModal } from "@/components/molecules";
import { useCart } from "@/context";
import { useCurrency } from "@/context/CurrencyContext";
import {
    Calendar,
    Clock,
    Users,
    Video,
    Share2,
    Heart,
    CheckCircle,
    MapPin,
    Shield,
    Star,
    Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Instructor {
    id?: string;
    name: string;
    avatar: string;
    bio?: string;
    rating?: number;
    reviews?: number;
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
    workshopType: "online" | "offline";
    // Offline fields
    location?: {
        country: string;
        city: string;
        address: string;
    };
    // Online fields
    meetingUrl?: string;
    meetingUserId?: string;
    meetingPassword?: string;
    // Legacy fields (for backward compatibility)
    country?: string;
    city?: string;
    requirements?: string[];
    agenda?: string[];
}

export default function WorkshopDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { addItem } = useCart();
    const { formatPrice } = useCurrency();

    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchWorkshop();
        }
    }, [slug]);

    const fetchWorkshop = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/workshops?slug=${slug}`);
            const data = await res.json();

            if (data && data.length > 0) {
                setWorkshop(data[0]);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
            </div>
        );
    }

    if (error || !workshop) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Header />
                <div className="container-app py-20 text-center">
                    <h1 className="text-2xl font-bold mb-4">Workshop not found</h1>
                    <Link href="/workshops">
                        <Button>Back to Workshops</Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const workshopDate = new Date(workshop.date);

    const handleRegister = () => {
        router.push(`/workshops/${slug}/checkout`);
    };

    const handleEnquiry = () => {
        setIsEnquiryModalOpen(true);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    const handleInstructorProfile = () => {
        if (workshop.instructor.id) {
            router.push(`/studio/${workshop.instructor.id}`);
        } else {
            alert("Instructor profile coming soon!");
        }
    };

    // Data is now guaranteed by the API
    const requirements = workshop.requirements!;
    const agenda = workshop.agenda!;
    const instructorBio = workshop.instructor.bio!;
    const instructorRating = workshop.instructor.rating!;
    const instructorReviews = workshop.instructor.reviews!;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <EnquiryModal
                isOpen={isEnquiryModalOpen}
                onClose={() => setIsEnquiryModalOpen(false)}
                workshopTitle={workshop.title}
            />

            {/* Hero Header */}
            <div className="relative h-[500px] lg:h-[600px]">
                <ImageWithFallback
                    src={workshop.thumbnail}
                    alt={workshop.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end">
                    <div className="container-app pb-16 lg:pb-20 text-white">
                        <div className="flex flex-wrap gap-3 mb-6">
                            {workshop.tags.map(tag => (
                                <span key={tag} className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/30 tracking-wide">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6 max-w-5xl leading-tight">{workshop.title}</h1>
                        <div className="flex flex-wrap gap-8 text-lg lg:text-xl font-medium">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-blue-400" />
                                <span suppressHydrationWarning>{workshopDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-6 h-6 text-blue-400" />
                                <span suppressHydrationWarning>{workshopDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {workshop.duration} min</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-6 h-6 text-blue-400" />
                                {workshop.workshopType === "offline" ? (
                                    <span>{workshop.location?.city || workshop.city}, {workshop.location?.country || workshop.country}</span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Online Workshop
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-app py-16 lg:py-24">
                <div className="grid lg:grid-cols-3 gap-16 lg:gap-24">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-16 lg:space-y-20">
                        {/* About */}
                        <section>
                            <h2 className="text-3xl font-bold mb-6">About this Workshop</h2>
                            <p className="text-xl text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                                {workshop.description}
                            </p>
                        </section>

                        {/* Agenda */}
                        <section>
                            <h2 className="text-3xl font-bold mb-8">Session Agenda</h2>
                            <div className="space-y-6">
                                {agenda.map((item, i) => (
                                    <div key={i} className="flex gap-6 p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="w-2 h-full min-h-[40px] bg-[var(--secondary-500)] rounded-full flex-shrink-0" />
                                        <span className="font-semibold text-lg">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Requirements */}
                        <section>
                            <h2 className="text-3xl font-bold mb-8">What You'll Need</h2>
                            <div className="grid sm:grid-cols-2 gap-6">
                                {requirements.map((req, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--muted)]/50">
                                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-lg font-medium">{req}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Instructor */}
                        <section className="bg-[var(--muted)]/30 rounded-3xl p-10 lg:p-12">
                            <h2 className="text-3xl font-bold mb-8">Your Instructor</h2>
                            <div className="flex flex-col sm:flex-row items-start gap-8">
                                <ImageWithFallback
                                    src={workshop.instructor.avatar}
                                    alt={workshop.instructor.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                                />
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-2">{workshop.instructor.name}</h3>
                                    <div className="flex items-center gap-4 text-base text-[var(--muted-foreground)] mb-6">
                                        <span className="flex items-center gap-1.5"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /> <span className="font-semibold text-[var(--foreground)]">{instructorRating}</span> Instructor Rating</span>
                                        <span>•</span>
                                        <span>{instructorReviews.toLocaleString()} Reviews</span>
                                    </div>
                                    <p className="text-lg text-[var(--muted-foreground)] leading-relaxed mb-6">
                                        {instructorBio}
                                    </p>
                                    <Button variant="link" className="px-0 text-lg text-[var(--secondary-600)] font-semibold" onClick={handleInstructorProfile}>
                                        View Studio Profile
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Sticky */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-32 shadow-2xl border-t-8 border-t-[var(--secondary-500)] overflow-hidden">
                            <CardContent className="p-6 space-y-6">
                                <div className="text-center">
                                    <p className="text-sm text-[var(--muted-foreground)] mb-1">Registration Fee</p>
                                    <span className="text-4xl font-bold">{formatPrice(workshop.price)}</span>
                                </div>

                                <div className="space-y-3">
                                    <Button size="lg" className="w-full text-lg shadow-lg hover:shadow-xl transition-all" onClick={handleRegister}>
                                        Register Now
                                    </Button>
                                    <Button variant="outline" size="lg" className="w-full" onClick={handleEnquiry}>
                                        I am Interested
                                    </Button>
                                </div>

                                <div className="pt-6 border-t border-[var(--border)] space-y-4 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--muted-foreground)]">Seats Remaining</span>
                                        <span className="font-medium text-amber-600">{workshop.capacity - workshop.enrolled} spots left</span>
                                    </div>
                                    <div className="w-full bg-[var(--muted)] h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${(workshop.enrolled / workshop.capacity) * 100}%` }} />
                                    </div>

                                    <ul className="space-y-3 pt-2">
                                        {workshop.workshopType === "offline" ? (
                                            <>
                                                <li className="flex gap-2">
                                                    <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                    <span>In-person workshop experience</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <Users className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                    <span>Hands-on learning with the instructor</span>
                                                </li>
                                                {workshop.location?.address && (
                                                    <li className="flex gap-2">
                                                        <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        <span className="text-xs text-gray-600">{workshop.location.address}</span>
                                                    </li>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <li className="flex gap-2">
                                                    <Video className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                    <span>Live interactive online session</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
                                                    <span>Recording available for 30 days</span>
                                                </li>
                                            </>
                                        )}
                                        <li className="flex gap-2">
                                            <Shield className="w-4 h-4 text-[var(--muted-foreground)]" />
                                            <span>30-day money-back guarantee</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
