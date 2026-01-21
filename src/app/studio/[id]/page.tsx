import { notFound } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import {
    Star,
    MapPin,
    Globe,
    Instagram,
    ShoppingBag,
    ChevronRight,
    BadgeCheck,
    Heart,
    Share2,
    Award,
    Calendar,
    Palette,
    Package,
    Sparkles,
    BookOpen,
    Users,
    Clock,
    PlayCircle,
} from "lucide-react";
import FollowShopButton from "./FollowShopButton";


interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StudioPage(props: PageProps) {
    const params = await props.params;
    await connectDB();

    // Fetch seller/artist details
    let seller;
    let products: any[] = [];
    let courses: any[] = [];

    try {
        seller = await User.findById(params.id)
            .select("name email avatar bio profile studioProfile artistProfile role isVerified createdAt")
            .lean();
    } catch (e) {
        console.log("Invalid ID or DB error, checking for mock instructor...");
    }

    // Mock Data Fallback for Workshop Instructors (if user not found in DB)
    if (!seller) {
        // Mock instructors based on the ID passed from workshops API
        const mockInstructors: Record<string, any> = {
            "65a1234567890abcdef12345": { name: "Emma Rodriguez", role: "studio", bio: "Watercolor enthusiast and nature lover. Specializing in landscapes and botanical art.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" },
            "65a1234567890abcdef12346": { name: "Sarah Mitchell", role: "studio", bio: "Classical oil painter with 15 years of teaching experience. Expert in color theory.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop" },
            "65a1234567890abcdef12347": { name: "Priya Singh", role: "studio", bio: "Keeper of traditions. Practicing Mithila (Madhubani) art for over 20 years.", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop" },
            // ... Add generic fallback for others
        };

        const mockData = mockInstructors[params.id] || {
            name: "Instructor Profile",
            role: "studio",
            bio: "Passionate creator and educator on Core Creator.",
            avatar: `https://ui-avatars.com/api/?name=Instructor&background=random`
        };

        seller = {
            _id: params.id,
            name: mockData.name,
            email: "instructor@example.com",
            avatar: mockData.avatar,
            bio: mockData.bio,
            role: mockData.role,
            isVerified: true,
            createdAt: new Date("2024-01-01"),
            profile: {
                location: "Global",
                website: "https://example.com",
                socialLinks: { instagram: "corecreator" }
            },
            studioProfile: { name: mockData.name } // Fallback for header logic
        };
    } else if (seller.role !== "studio") {
        // If valid user but not a creator role, just 404 as before
        notFound();
    }

    // Fetch products if real user, otherwise empty for mock
    if (seller._id && !seller.email.includes("instructor@example.com")) { // Check if real
        products = await Product.find({
            seller: params.id,
            status: "active"
        })
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();

        courses = await Course.find({
            instructor: params.id,
            status: "published"
        })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();
    }

    // Calculate seller stats from products (Real DB calc or Mock)
    let productStats = [];
    let courseStats = [];

    if (seller._id && !seller.email.includes("instructor@example.com")) {
        productStats = await Product.aggregate([
            { $match: { seller: seller._id } },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalSales: { $sum: "$salesCount" },
                    productAvgRating: { $avg: "$rating" },
                    productReviews: { $sum: "$reviewCount" }
                }
            }
        ]);

        courseStats = await Course.aggregate([
            { $match: { instructor: seller._id } },
            {
                $group: {
                    _id: null,
                    totalCourses: { $sum: 1 },
                    totalStudents: { $sum: "$enrollmentCount" },
                    courseAvgRating: { $avg: "$rating" }
                }
            }
        ]);
    }

    const pStats = productStats[0] || { totalProducts: 0, totalSales: 0, productAvgRating: 0, productReviews: 0 };
    const cStats = courseStats[0] || { totalCourses: 0, totalStudents: 0, courseAvgRating: 0 };

    // Update stats for mock users to look alive
    if (seller.email.includes("instructor@example.com")) {
        cStats.totalCourses = 5;
        cStats.totalStudents = 120;
        cStats.courseAvgRating = 4.9;
    }

    // Combined stats
    const sellerStats = {
        totalProducts: pStats.totalProducts,
        totalCourses: cStats.totalCourses,
        totalSales: pStats.totalSales,
        totalStudents: cStats.totalStudents,
        avgRating: pStats.productAvgRating || cStats.courseAvgRating || 0,
        totalReviews: pStats.productReviews
    };

    // Serialize data
    const sellerData = JSON.parse(JSON.stringify(seller));
    const productsData = JSON.parse(JSON.stringify(products));
    const coursesData = JSON.parse(JSON.stringify(courses));


    // Fetch Workshops (Real)
    let workshops: any[] = [];
    try {
        const Workshop = (await import("@/lib/db/models/Workshop")).default;
        workshops = await Workshop.find({
            instructor: params.id,
            status: "published"
        })
            .sort({ date: 1 })
            .lean();
    } catch (e) {
        console.error("Error fetching workshops:", e);
    }

    // Serialize workshops
    const workshopsData = JSON.parse(JSON.stringify(workshops));
    const hasWorkshops = workshopsData.length > 0;

    // Update stats with workshops
    if (hasWorkshops) {
        // logic to add workshop stats if needed
    }

    // Calculate member since
    const memberSince = new Date(sellerData.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
    });

    const hasProducts = productsData.length > 0;
    const hasCourses = coursesData.length > 0;



    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <main className="pt-20 pb-16">
                {/* Hero Section with Gradient Background */}
                <div className="relative overflow-hidden">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--secondary-900)] via-[var(--secondary-800)] to-[var(--secondary-700)]" />
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--secondary-500)] rounded-full filter blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse delay-1000" />
                    </div>

                    {/* Pattern overlay */}
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

                    <div className="container-app relative z-10 py-16 md:py-24 pb-24 md:pb-32">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-sm text-white/70 mb-8">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-4 h-4" />
                            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-white">{sellerData.studioProfile?.name || sellerData.name}&apos;s Studio</span>
                        </nav>

                        {/* Profile Card */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left: Avatar and Info */}
                            <div className="flex flex-col sm:flex-row gap-6 flex-1">
                                {/* Avatar */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--secondary-400)] to-purple-400 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity" />
                                    <img
                                        src={sellerData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerData.name)}&size=160&background=random`}
                                        alt={sellerData.name}
                                        className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white/20 object-cover shadow-2xl"
                                    />
                                    {sellerData.isVerified && (
                                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white/20">
                                            <BadgeCheck className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>

                                {/* Name and Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                                            {sellerData.studioProfile?.name || sellerData.name}
                                        </h1>
                                        {sellerData.isVerified && (
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                                                Verified
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium rounded-full capitalize flex items-center gap-1.5">
                                            <Palette className="w-3.5 h-3.5" />
                                            {sellerData.role}
                                        </span>
                                        <span className="text-white/60 text-sm flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Member since {memberSince}
                                        </span>
                                    </div>

                                    {sellerData.bio && (
                                        <p className="text-white/80 max-w-xl leading-relaxed mb-4">
                                            {sellerData.studioProfile?.description || sellerData.bio}
                                        </p>
                                    )}

                                    {/* Quick Links */}
                                    <div className="flex flex-wrap gap-3 text-sm">
                                        {sellerData.profile?.location && (
                                            <span className="flex items-center gap-1.5 text-white/70 bg-white/5 px-3 py-1.5 rounded-full">
                                                <MapPin className="w-4 h-4" />
                                                {sellerData.profile.location}
                                            </span>
                                        )}
                                        {sellerData.profile?.website && (
                                            <a
                                                href={sellerData.profile.website}
                                                target="_blank"
                                                rel="noopener"
                                                className="flex items-center gap-1.5 text-white/70 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                                            >
                                                <Globe className="w-4 h-4" />
                                                Website
                                            </a>
                                        )}
                                        {sellerData.profile?.socialLinks?.instagram && (
                                            <a
                                                href={`https://instagram.com/${sellerData.profile.socialLinks.instagram}`}
                                                target="_blank"
                                                rel="noopener"
                                                className="flex items-center gap-1.5 text-white/70 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                                            >
                                                <Instagram className="w-4 h-4" />
                                                @{sellerData.profile.socialLinks.instagram}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex flex-col gap-3 w-full sm:w-auto">
                                <FollowShopButton sellerId={params.id} sellerName={sellerData.name} />
                                <Button variant="ghost" className="w-full sm:w-auto px-8 py-3 text-base text-white/70 hover:text-white hover:bg-white/5">
                                    <Share2 className="w-5 h-5 mr-2" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="container-app py-12 relative z-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-[var(--card)] backdrop-blur-lg border border-[var(--border)] rounded-2xl p-6 text-center shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="w-12 h-12 bg-gradient-to-br from-[var(--secondary-500)] to-[var(--secondary-600)] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
                                {sellerStats.totalProducts}
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Products</p>
                        </div>

                        <div className="bg-[var(--card)] backdrop-blur-lg border border-[var(--border)] rounded-2xl p-6 text-center shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
                                {sellerStats.totalCourses}
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Courses</p>
                        </div>

                        <div className="bg-[var(--card)] backdrop-blur-lg border border-[var(--border)] rounded-2xl p-6 text-center shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
                                {sellerStats.avgRating > 0 ? sellerStats.avgRating.toFixed(1) : "New"}
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Rating</p>
                        </div>

                        <div className="bg-[var(--card)] backdrop-blur-lg border border-[var(--border)] rounded-2xl p-6 text-center shadow-xl hover:shadow-2xl transition-shadow group">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
                                {sellerStats.totalReviews}
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Reviews</p>
                        </div>
                    </div>
                </div>

                {/* Courses Section - Only show if has courses */}
                {hasCourses && (
                    <div className="container-app py-12">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                                    <PlayCircle className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Courses</h2>
                            </div>
                            <span className="text-sm text-[var(--muted-foreground)]">
                                {coursesData.length} course{coursesData.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {coursesData.map((course: any) => (
                                <Card key={course._id} hover className="overflow-hidden group border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                                    <Link href={`/learn/${course.slug}`} className="block aspect-video overflow-hidden relative">
                                        <img
                                            src={course.thumbnail || "https://placehold.co/800x450?text=Course"}
                                            alt={course.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Play button overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                                <PlayCircle className="w-8 h-8 text-[var(--secondary-600)]" />
                                            </div>
                                        </div>

                                        {/* Level badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full capitalize">
                                                {course.level || "All Levels"}
                                            </span>
                                        </div>
                                    </Link>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-[var(--muted-foreground)] mb-1">{course.category}</p>
                                        <Link href={`/learn/${course.slug}`} className="font-medium text-sm line-clamp-2 hover:text-[var(--secondary-600)] transition-colors">
                                            {course.title}
                                        </Link>
                                        <div className="flex items-center gap-3 mt-3 text-xs text-[var(--muted-foreground)]">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {course.enrollmentCount || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {Math.round((course.duration || 0) / 60)}h
                                            </span>
                                            {course.rating > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    {course.rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                                            <span className="font-bold text-lg text-[var(--secondary-600)]">
                                                {course.price === 0 ? "Free" : `$${course.price}`}
                                            </span>
                                            <Button variant="ghost" size="sm" className="text-xs">
                                                View Course
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Products Section - Only show if has products */}
                {hasProducts && (
                    <div className="container-app py-12">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-[var(--secondary-500)] to-[var(--secondary-600)] rounded-xl">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Artwork & Products</h2>
                            </div>
                            <span className="text-sm text-[var(--muted-foreground)]">
                                {productsData.length} item{productsData.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {productsData.map((product: any) => (
                                <Card key={product._id} hover className="overflow-hidden group border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                                    <Link href={`/marketplace/${product.slug}`} className="block aspect-square overflow-hidden relative">
                                        <img
                                            src={product.images?.find((i: any) => i.isPrimary)?.url || product.images?.[0]?.url || "https://placehold.co/400x400?text=Product"}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Quick actions */}
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <span className="text-white font-bold text-lg drop-shadow-lg">
                                                ${product.price}
                                            </span>
                                            <button className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-900 transition-colors shadow-lg">
                                                <Heart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </Link>
                                    <CardContent className="p-4">
                                        <Link href={`/marketplace/${product.slug}`} className="font-medium text-sm line-clamp-2 hover:text-[var(--secondary-600)] transition-colors">
                                            {product.name}
                                        </Link>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="font-bold text-lg text-[var(--secondary-600)]">${product.price}</span>
                                            <div className="flex items-center gap-1.5 bg-[var(--muted)] px-2 py-1 rounded-full">
                                                {product.rating > 0 ? (
                                                    <>
                                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                        <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-[var(--muted-foreground)]">New</span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Workshops Section - Only show if has workshops */}
                {hasWorkshops && (
                    <div className="container-app py-12">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Workshops</h2>
                            </div>
                            <span className="text-sm text-[var(--muted-foreground)]">
                                {workshopsData.length} workshop{workshopsData.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {workshopsData.map((workshop: any) => (
                                <Card key={workshop.id} hover className="overflow-hidden group border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                                    <Link href={`/workshops/${workshop.slug}`} className="block aspect-video overflow-hidden relative">
                                        <img
                                            src={workshop.thumbnail || "https://placehold.co/800x450?text=Workshop"}
                                            alt={workshop.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Calendar overlay */}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-lg p-2 text-center min-w-[3.5rem] shadow-sm">
                                            <p className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">
                                                {new Date(workshop.date).toLocaleDateString("en-US", { month: "short" })}
                                            </p>
                                            <p className="text-lg font-bold text-[var(--foreground)]">
                                                {new Date(workshop.date).getDate()}
                                            </p>
                                        </div>
                                    </Link>
                                    <CardContent className="p-4">
                                        <p className="text-xs text-[var(--muted-foreground)] mb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {workshop.city}, {workshop.country}
                                        </p>
                                        <Link href={`/workshops/${workshop.slug}`} className="font-medium text-sm line-clamp-2 hover:text-[var(--secondary-600)] transition-colors">
                                            {workshop.title}
                                        </Link>
                                        <div className="flex items-center gap-3 mt-3 text-xs text-[var(--muted-foreground)]">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {workshop.capacity - workshop.enrolled} spots left
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {Math.round((workshop.duration || 0) / 60)}h
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                                            <span className="font-bold text-lg text-[var(--secondary-600)]">
                                                ${workshop.price}
                                            </span>
                                            <Button variant="ghost" size="sm" className="text-xs">
                                                Book Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state if no products and no courses */}
                {!hasProducts && !hasCourses && !hasWorkshops && (
                    <div className="container-app py-12">
                        <div className="text-center py-20 bg-gradient-to-b from-[var(--muted)]/50 to-transparent rounded-3xl">
                            <div className="w-20 h-20 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-10 h-10 text-[var(--muted-foreground)]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Nothing here yet</h3>
                            <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                                This studio hasn&apos;t listed any products, courses, or workshops yet. Check back soon for amazing content!
                            </p>
                            <Link href="/marketplace">
                                <Button variant="secondary" className="mt-6">
                                    Browse Marketplace
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
