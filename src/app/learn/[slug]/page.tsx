"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Header, Footer, ReviewsSection } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { useCart } from "@/context";
import {
    Star,
    Clock,
    PlayCircle,
    BookOpen,
    Award,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Globe,
    Infinity,
    FileText,
    Download,
    Heart,
    Share2,
    Loader2,
    Users,
    MessageSquare,
    X
} from "lucide-react";
import { VideoPlayer } from "@/components/molecules";
import { useCurrency } from "@/context/CurrencyContext";

interface Lesson {
    title: string;
    description?: string;
    type: string;
    order: number;
    duration?: number;
    isFree: boolean;
}

interface Section {
    title: string;
    lessons: Lesson[];
    order: number;
    duration?: number;
}

interface Instructor {
    _id: string;
    name: string;
    avatar?: string;
    bio?: string;
    rating?: number;
    students?: number;
    courses?: number;
}

interface Course {
    _id: string;
    title: string;
    slug: string;
    subtitle?: string;
    description: string;
    thumbnail: string;
    promoVideo?: string;
    instructor: Instructor;
    instructorName: string;
    price: number;
    compareAtPrice?: number;
    rating: number;
    reviewCount: number;
    enrollmentCount: number;
    totalDuration: number; // in minutes
    totalLessons: number; // populated by middleware/virtuals theoretically
    level: string;
    category?: string;
    language: string;
    updatedAt: string;
    isBestseller: boolean;
    learningOutcomes: string[];
    targetAudience: string[];
    prerequisites: string[];
    sections: Section[];
}



export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { addItem } = useCart();
    const { formatPrice } = useCurrency();

    // Course State
    const [course, setCourse] = React.useState<Course | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [expandedSection, setExpandedSection] = React.useState<number | null>(0);

    // Actions State
    const [addedToCart, setAddedToCart] = React.useState(false);
    const [wishlistActive, setWishlistActive] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [previewOpen, setPreviewOpen] = React.useState(false);

    const slug = params.slug as string;

    React.useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/courses/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Course not found");
                    throw new Error("Failed to fetch course");
                }
                const data = await res.json();
                setCourse(data.course);

            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchCourse();
    }, [slug]);

    const handleAddToCart = () => {
        if (!course) return;
        addItem({
            id: course._id,
            type: "course",
            name: course.title,
            price: course.price,
            quantity: 1,
            image: course.thumbnail,
            instructor: course.instructor?.name || course.instructorName,
        });
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        if (!course) return;
        handleAddToCart();
        router.push("/checkout");
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleWishlist = () => {
        setWishlistActive(!wishlistActive);
        // Toast logic would go here
    };

    const handleFeatureComingSoon = (feature: string) => {
        alert(`${feature} feature coming soon!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-2xl font-bold mb-4">Course not found</h1>
                    <p className="text-[var(--muted-foreground)] mb-6">{error || "The course you are looking for does not exist."}</p>
                    <Link href="/learn">
                        <Button>Browse Courses</Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] font-sans">
            <Header />

            {/* Hero Section */}
            <div className="relative bg-gray-900 text-white overflow-hidden">
                {/* Background Gradient & Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900" />

                <div className="container-app relative z-10">
                    <div className="py-12 lg:py-20 lg:pr-[400px]"> {/* Add padding-right to prevent overlap with absolute card */}
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-sm text-purple-200/80 mb-6 font-medium">
                            <Link href="/learn" className="hover:text-white transition-colors">Courses</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="capitalize">{course.category || "General"}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="capitalize text-white">{course.level}</span>
                        </nav>

                        {/* Title & Subtitle */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                            {course.title}
                        </h1>
                        <p className="text-lg lg:text-xl text-purple-100/90 mb-8 max-w-2xl leading-relaxed">
                            {course.subtitle || course.description}
                        </p>

                        {/* Ratings & Stats */}
                        <div className="flex flex-wrap items-center gap-6 mb-8 text-sm sm:text-base">
                            <div className="flex items-center gap-2 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                                <span className="text-yellow-400 font-bold flex items-center gap-1">
                                    {(course.rating || 0).toFixed(1)} <Star className="w-4 h-4 fill-current" />
                                </span>
                                <span className="text-purple-200 underline decoration-purple-200/50 underline-offset-4">
                                    ({(course.reviewCount || 0).toLocaleString()} reviews)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-200">
                                <Users className="w-4 h-4" />
                                <span>{(course.enrollmentCount || 0).toLocaleString()} students</span>
                            </div>
                        </div>

                        {/* Instructor info removed as per request */}

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-purple-200/80 font-medium">
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Last updated {new Date(course.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <Globe className="w-4 h-4" /> {course.language}
                            </span>
                            <span className="flex items-center gap-2">
                                <Award className="w-4 h-4" /> Certificate of Completion
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section with Sticky Sidebar Container */}
            <div className="container-app relative">
                {/* Absolute Floating Card (Desktop) / Static (Mobile) */}
                <div className="lg:absolute lg:top-[-350px] lg:right-0 lg:w-[360px] z-20">
                    <div className="bg-white rounded-2xl shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden sticky top-24">
                        {/* Video Preview */}
                        <div
                            className="relative aspect-video bg-gray-900 group cursor-pointer"
                            onClick={() => setPreviewOpen(true)}
                        >
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity duration-300"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                                        <PlayCircle className="w-6 h-6 text-purple-600 fill-purple-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="text-white text-sm font-semibold drop-shadow-md">Preview this course</span>
                            </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold text-gray-900">{formatPrice(course.price)}</span>
                                {course.compareAtPrice && (
                                    <>
                                        <span className="text-xl text-gray-500 line-through mb-1">{formatPrice(course.compareAtPrice)}</span>
                                        <span className="text-sm font-bold text-green-600 mb-1.5 px-2 py-0.5 bg-green-50 rounded-full">
                                            {Math.round((1 - course.price / course.compareAtPrice) * 100)}% OFF
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Button
                                    size="lg"
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-lg font-semibold h-12 shadow-md shadow-purple-600/20"
                                    onClick={handleAddToCart}
                                >
                                    {addedToCart ? "Added to Cart!" : "Add to Cart"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-700 font-semibold h-12"
                                    onClick={handleBuyNow}
                                >
                                    Buy Now
                                </Button>
                            </div>

                            <p className="text-center text-xs text-gray-500">30-Day Money-Back Guarantee</p>

                            {/* Features List */}
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                                <h4 className="font-bold text-gray-900 text-sm">This course includes:</h4>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 flex justify-center"><Clock className="w-4 h-4 text-purple-600" /></div>
                                        <span>{Math.round(course.totalDuration / 60)} hours on-demand video</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 flex justify-center"><BookOpen className="w-4 h-4 text-purple-600" /></div>
                                        <span>{course.totalLessons} lessons</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 flex justify-center"><Download className="w-4 h-4 text-purple-600" /></div>
                                        <span>Downloadable resources</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 flex justify-center"><Infinity className="w-4 h-4 text-purple-600" /></div>
                                        <span>Full livetime access</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 flex justify-center"><Globe className="w-4 h-4 text-purple-600" /></div>
                                        <span>Access on mobile and TV</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 flex justify-center"><Award className="w-4 h-4 text-purple-600" /></div>
                                        <span>Certificate of completion</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button onClick={handleShare} className="flex-1 py-2 text-sm font-medium text-gray-600 underline hover:text-purple-600">
                                    {copied ? "Link Copied!" : "Share"}
                                </button>
                                <button onClick={() => handleFeatureComingSoon("Gift")} className="flex-1 py-2 text-sm font-medium text-gray-600 underline hover:text-purple-600">Gift this course</button>
                                <button onClick={() => handleFeatureComingSoon("Coupon")} className="flex-1 py-2 text-sm font-medium text-gray-600 underline hover:text-purple-600">Apply Coupon</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 py-12">
                    <div className="lg:col-span-2 space-y-12">

                        {/* Learning Outcomes */}
                        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                            <div className="border border-gray-200 p-8 rounded-2xl bg-white shadow-sm">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">What you'll learn</h2>
                                <div className="grid md:grid-cols-2 gap-y-4 gap-x-8">
                                    {course.learningOutcomes.map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Course Content */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
                                <div className="text-sm text-gray-500 font-medium">
                                    {course.sections.length} sections • {course.totalLessons} lessons • {Math.round(course.totalDuration / 60)}h total length
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200 bg-white shadow-sm">
                                {course.sections.length > 0 ? course.sections.map((section, i) => (
                                    <div key={i}>
                                        <button
                                            onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expandedSection === i ? "rotate-180" : ""}`} />
                                                <span className="font-bold text-gray-800">{section.title}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">{section.lessons.length} lectures</span>
                                        </button>

                                        {expandedSection === i && (
                                            <div className="p-2 space-y-1 bg-white">
                                                {section.lessons.map((lesson, j) => (
                                                    <div key={j} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-5 flex justify-center">
                                                                {lesson.type === 'video' ? <PlayCircle className="w-4 h-4 text-gray-400 group-hover:text-purple-600" /> : <FileText className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />}
                                                            </div>
                                                            <span className="text-sm text-gray-600 group-hover:text-purple-900 transition-colors">{lesson.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                                            {lesson.isFree && <span className="text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">Preview</span>}
                                                            <span>{lesson.duration ? `${lesson.duration}:00` : '05:00'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-gray-500">
                                        <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        <p>No content sections available yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Requirements */}
                        {course.prerequisites && course.prerequisites.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Requirements</h2>
                                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                                    {course.prerequisites.map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Target Audience */}
                        {course.targetAudience && course.targetAudience.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Who this course is for</h2>
                                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                                    {course.targetAudience.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Description</h2>
                            <div className="prose max-w-none text-gray-700 leading-relaxed">
                                <p>{course.description}</p>
                            </div>
                        </div>

                        {/* Instructor */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Instructor</h2>
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    {course.instructor?.avatar ? (
                                        <img src={course.instructor.avatar} alt={course.instructorName} className="w-20 h-20 rounded-full border-4 border-white shadow-sm" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-2xl border-4 border-white shadow-sm">
                                            {course.instructorName.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-purple-700 underline underline-offset-4 decoration-purple-200">{course.instructorName}</h3>
                                        <p className="text-gray-500">{course.instructor?.bio || "Expert Instructor & Creator"}</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    {course.instructor?.bio || "Highly experienced instructor with a passion for teaching and helping students achieve their potential. With years of industry experience, they bring real-world knowledge to the classroom."}
                                </p>
                                <div className="flex gap-8 text-sm font-medium text-gray-700">
                                    <div className="flex flex-col items-center gap-1">
                                        <Star className="w-5 h-5 text-amber-500 fill-current" />
                                        <span>{course.instructor?.rating || 4.8} Rating</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Users className="w-5 h-5 text-blue-500" />
                                        <span>{(course.instructor?.students || 12000).toLocaleString()} Students</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <PlayCircle className="w-5 h-5 text-purple-500" />
                                        <span>{course.instructor?.courses || 5} Courses</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="pt-8 border-t border-gray-100">
                            <ReviewsSection targetId={course._id} targetType="course" />
                        </div>

                    </div>
                    {/* Right column is empty on desktop because the card is absolute positioning over it. 
                        On mobile, the card might need to be rendered here or handled via responsive classes. 
                        For now, the absolute positioning logic handles the desktop 'sidebar'.
                    */}
                </div>
            </div>

            <Footer />
        </div>
    );

}
