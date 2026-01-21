"use client";

import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import Image from "next/image";
import { Button, ImageWithFallback } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { Header, Footer } from "@/components/organisms";
import {
  ArrowRight,
  Palette,
  GraduationCap,
  Store,
  Play,
  Star,
  Users,
  Award,
  Sparkles,
  Heart,
  ShoppingBag,
  Calendar,
  Video,
  Globe,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface FeaturedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  currency?: "USD" | "INR" | "EUR" | "GBP";
  images: { url: string; isPrimary: boolean }[];
  seller: { name: string };
  category: string;
}

interface TopRatedCourse {
  _id: string;
  title: string;
  slug: string;
  instructorName: string;
  rating: number;
  enrollmentCount: number;
  price: number;
  thumbnail: string;
  level: string;
}

interface Workshop {
  id: string;
  title: string;
  instructor: {
    name: string;
    avatar: string;
  };
  date: string;
  time: string;
  price: number;
  thumbnail: string;
  category: string;
  slug: string;
}

interface Artist {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  courses: number;
  products: number;
  rating: number;
}

const stats = [
  { label: "Artists & Creators", value: "50K+", icon: Palette },
  { label: "Courses & Workshops", value: "2,500+", icon: GraduationCap },
  { label: "Artworks Listed", value: "100K+", icon: Store },
  { label: "Creator Earnings", value: "Creator Earnings", icon: Users },
];

const features = [
  {
    title: "Buy Authentic Artworks",
    description: "Discover unique paintings, sculptures, and crafts from talented artists worldwide.",
    icon: ShoppingBag,
    color: "from-blue-500 to-blue-700",
    href: "/marketplace",
  },
  {
    title: "Learn Art & Craft",
    description: "Master new skills with HD video courses from beginner to advanced levels.",
    icon: Video,
    color: "from-amber-500 to-yellow-600",
    href: "/learn",
  },
  {
    title: "Attend Workshops",
    description: "Join live online or in-person workshops with hands-on learning experiences.",
    icon: Calendar,
    color: "from-blue-600 to-indigo-700",
    href: "/workshops",
  },
  {
    title: "Sell Your Creations",
    description: "Open your own store and reach art lovers across the globe.",
    icon: Globe,
    color: "from-emerald-500 to-teal-600",
    href: "/studio/register",
  },
];

import { categories } from "@/lib/categories";
import { courseCategories } from "@/lib/courseCategories";

export default function HomePage() {
  const { formatPrice } = useCurrency();
  const [featuredArtworks, setFeaturedArtworks] = useState<FeaturedProduct[]>([]);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [topCourses, setTopCourses] = useState<TopRatedCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loadingWorkshops, setLoadingWorkshops] = useState(true);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoadingArtworks(true);
      setLoadingCourses(true);
      setLoadingWorkshops(true);
      try {
        // Fetch Artworks
        let productRes = await fetch("/api/products?featured=true&limit=4");
        let productData = await productRes.json();
        let products = productData.products || [];

        if (products.length === 0) {
          productRes = await fetch("/api/products?limit=4&sort=newest");
          productData = await productRes.json();
          products = productData.products || [];
        }
        setFeaturedArtworks(products);

        // Fetch Top Courses
        let courseRes = await fetch("/api/courses?sort=rating&limit=4");
        let courseData = await courseRes.json();
        let courses = courseData.courses || [];

        if (courses.length === 0) {
          courseRes = await fetch("/api/courses?sort=popular&limit=4");
          courseData = await courseRes.json();
          courses = courseData.courses || [];
        }
        setTopCourses(courses);

        // Fetch Workshops
        const workshopRes = await fetch("/api/workshops?sort=upcoming&limit=4");
        const workshopData = await workshopRes.json();
        setWorkshops(workshopData || []);

        // Fetch Featured Artists
        const artistRes = await fetch("/api/artists?limit=4&sort=rating");
        const artistData = await artistRes.json();
        setArtists(artistData.artists || []);

      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      } finally {
        setLoadingArtworks(false);
        setLoadingCourses(false);
        setLoadingWorkshops(false);
        setLoadingArtists(false);
      }
    };

    fetchData();
  }, []);

  // Wishlist toggle handler
  const handleWishlistToggle = async (e: React.MouseEvent, itemId: string, itemType: 'product' | 'course') => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Wishlist toggle clicked:', itemId, itemType);

    try {
      const res = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType })
      });

      console.log('Wishlist API response status:', res.status);

      if (res.status === 401) {
        // Redirect to login
        alert('Please login to add items to your wishlist');
        window.location.href = '/login?returnUrl=' + encodeURIComponent(window.location.pathname);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        console.log('Wishlist response data:', data);
        setWishlist(prev => {
          const newSet = new Set(prev);
          if (data.inWishlist) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });
      } else {
        const errorData = await res.json();
        console.error('Wishlist error:', errorData);
        alert(errorData.message || 'Failed to update wishlist');
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-70" />
        <div className="absolute top-32 left-10 w-20 h-20 rounded-full bg-[var(--secondary-200)] blur-2xl opacity-60 animate-float" />
        <div className="absolute top-48 right-20 w-32 h-32 rounded-full bg-[var(--primary-200)] blur-3xl opacity-60 animate-float" style={{ animationDelay: "1s" }} />

        <div className="container-app relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--secondary-100)] text-[var(--secondary-700)] text-sm font-medium mb-6 animate-fade-in-down border border-[var(--secondary-200)]">
              <Sparkles className="w-4 h-4" />
              <span>The Global Art & Craft Ecosystem</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
              <span className="text-[var(--foreground)]">Create. Learn.</span>
              <br />
              <span className="text-gradient">Inspire the World.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Join 50,000+ artists and creators on the ultimate platform for learning, teaching, and selling art & craft globally.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="secondary" size="xl" className="w-full sm:w-auto shadow-lg" asChild>
                <Link href="/register">
                  <span>Start Learning</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="w-full sm:w-auto" asChild>
                <Link href="/studio/register">
                  <Palette className="w-5 h-5" />
                  <span>Become an Instructor</span>
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-[var(--muted-foreground)] animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[var(--primary-500)] fill-[var(--primary-500)]" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="h-4 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-[var(--secondary-500)]" />
                <span>Trusted by 500K+</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-[var(--border)] bg-[var(--muted)]">
        <div className="container-app">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--secondary-100)] text-[var(--secondary-600)] mb-3">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-[var(--secondary-600)]">
                  {stat.label === "Creator Earnings" ? formatPrice(54695, "INR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + "+" : stat.value}
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to<span className="text-gradient-blue"> Thrive</span>
            </h2>
            <p className="text-[var(--muted-foreground)]">Whether you're a creator, learner, or collector—Core Creator has the tools to help you succeed.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} hover className="p-6 animate-fade-in-up group" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">{feature.description}</p>
                <Link href={feature.href} className="inline-flex items-center text-sm font-medium text-[var(--secondary-600)] hover:underline">
                  Learn more<ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="py-20 bg-gradient-to-b from-[var(--muted)] to-white">
        <div className="container-app">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Featured <span className="text-gradient">Artworks</span></h2>
              <p className="text-[var(--muted-foreground)]">Handpicked masterpieces from talented artists</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" asChild>
              <Link href="/marketplace">View All<ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>

          {loadingArtworks ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-500)]" />
            </div>
          ) : featuredArtworks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArtworks.map((art, index) => (
                <Card key={art._id} hover className="overflow-hidden group animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="relative aspect-square">
                    <Link href={`/marketplace/${art.slug}`}>
                      <img
                        src={art.images?.find(i => i.isPrimary)?.url || art.images?.[0]?.url || "https://placehold.co/400x500?text=Artwork"}
                        alt={art.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                      />
                    </Link>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <Button size="sm" className="w-full" asChild>
                        <Link href={`/marketplace/${art.slug}`}>View Details</Link>
                      </Button>
                    </div>
                    {art.compareAtPrice && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">SALE</div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleWishlistToggle(e, art._id, 'product')}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-10"
                    >
                      <Heart className={`w-4 h-4 ${wishlist.has(art._id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-[var(--muted-foreground)] mb-1">{art.category}</p>
                    <Link href={`/marketplace/${art.slug}`} className="hover:text-[var(--secondary-600)] transition-colors">
                      <h3 className="font-semibold line-clamp-1">{art.name}</h3>
                    </Link>
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">by {art.seller?.name || "Artist"}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[var(--secondary-600)]">{formatPrice(art.price, art.currency || "INR")}</span>
                      {art.compareAtPrice && (
                        <span className="text-sm text-[var(--muted-foreground)] line-through">{formatPrice(art.compareAtPrice, art.currency || "INR")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              No featured artworks available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-[var(--muted)]">
        <div className="container-app">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Explore Categories</h2>
              <p className="text-[var(--muted-foreground)]">Discover art across all mediums and styles</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" asChild>
              <Link href="/product/categories">View All<ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category, index) => (
              <Link key={category.name} href={`/product/categories/${category.slug}`} className="group relative rounded-2xl overflow-hidden aspect-[4/5] animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold">{category.name}</h3>
                  <p className="text-white/70 text-sm">{category.count} items</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Courses Section */}
      <section className="py-20 bg-[var(--muted)]">
        <div className="container-app">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Top Rated <span className="text-gradient-purple">Courses</span></h2>
              <p className="text-[var(--muted-foreground)]">Join thousands of students learning from the best</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" asChild>
              <Link href="/learn">View All Courses<ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>

          {loadingCourses ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-500)]" />
            </div>
          ) : topCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topCourses.map((course, index) => (
                <Card key={course._id} hover className="group overflow-hidden animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="relative aspect-video overflow-hidden">
                    <img src={course.thumbnail || "https://placehold.co/600x400?text=Course"} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur text-xs font-bold rounded text-[var(--foreground)] capitalize">
                      {course.level}
                    </div>
                    <Link href={`/learn/${course.slug}`} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white fill-current" />
                    </Link>
                  </div>
                  <CardContent className="p-5 flex flex-col h-[180px]">
                    <div className="flex items-center gap-2 mb-2 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {course.rating?.toFixed(1) || "New"}</span>
                      <span>•</span>
                      <span>{course.enrollmentCount?.toLocaleString()} students</span>
                    </div>
                    <Link href={`/learn/${course.slug}`} className="hover:text-[var(--secondary-600)] transition-colors">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{course.title}</h3>
                    </Link>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">by {course.instructorName || "Instructor"}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-lg font-bold text-[var(--foreground)]">{formatPrice(course.price)}</span>
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/learn/${course.slug}`}>Start Learning</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              No courses available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* Course Categories Section */}
      <section className="py-20">
        <div className="container-app">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Learn a New <span className="text-gradient">Skill</span></h2>
              <p className="text-[var(--muted-foreground)]">Explore expert-led courses in every creative discipline</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" asChild>
              <Link href="/learn/categories">View All Categories<ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {courseCategories.slice(0, 6).map((category, index) => (
              <Link key={category.name} href={`/learn/categories/${category.slug}`} className="group relative rounded-2xl overflow-hidden aspect-[4/5] animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold">{category.name}</h3>
                  <p className="text-white/70 text-sm">{category.count} Courses</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Workshops Section */}
      <section className="py-20 bg-[var(--background)]">
        <div className="container-app">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2">Latest <span className="text-gradient">Workshops</span></h2>
              <p className="text-[var(--muted-foreground)]">Join live interactive sessions with top creators</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" asChild>
              <Link href="/workshops">View All Workshops<ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>

          {loadingWorkshops ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-500)]" />
            </div>
          ) : workshops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {workshops.map((workshop, index) => (
                <div key={workshop.id} className="group bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:shadow-lg transition-all animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="relative aspect-video overflow-hidden">
                    <ImageWithFallback
                      src={workshop.thumbnail}
                      alt={workshop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[var(--foreground)] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(workshop.date).toLocaleDateString()}
                    </div>
                    <div className="absolute top-3 left-3 bg-[var(--secondary-500)] text-white px-3 py-1 rounded-full text-xs font-bold">
                      {workshop.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-[var(--secondary-600)] transition-colors">
                      <Link href={`/workshops/${workshop.slug}`}>{workshop.title}</Link>
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <img src={workshop.instructor.avatar} alt={workshop.instructor.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-sm text-[var(--muted-foreground)]">{workshop.instructor.name}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                      <span className="text-lg font-bold text-[var(--foreground)]">{formatPrice(workshop.price)}</span>
                      <Button size="sm" asChild>
                        <Link href={`/workshops/${workshop.slug}`}>Register Now</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              No workshops available at the moment.
            </div>
          )}
        </div>
      </section>



      {/* Featured Artists Section */}
      <section className="py-20 bg-[var(--muted)]">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Meet Our Top <span className="text-gradient">Artists</span></h2>
            <p className="text-[var(--muted-foreground)]">Discover and learn from world-class artists who teach and sell on Core Creator</p>
          </div>

          {loadingArtists ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--secondary-500)]" />
            </div>
          ) : artists.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {artists.map((artist, index) => (
                <Link key={artist.id} href={`/artists/${artist.id}`}>
                  <Card hover className="p-6 text-center animate-fade-in-up cursor-pointer" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="relative inline-block mb-4">
                      <img src={artist.avatar} alt={artist.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--secondary-500)] rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                        ✓
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg">{artist.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-3">{artist.specialty}</p>
                    <div className="flex justify-center gap-4 text-xs text-[var(--muted-foreground)] mb-3">
                      <span>{artist.courses} Courses</span>
                      <span>•</span>
                      <span>{artist.products} Artworks</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-[var(--primary-500)] fill-[var(--primary-500)]" />
                      <span className="font-semibold">{artist.rating}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Sarah Mitchell", specialty: "Watercolor Artist", courses: 12, products: 45, rating: 4.9, image: "https://randomuser.me/api/portraits/women/1.jpg" },
                { name: "Michael Chen", specialty: "Oil Painting Master", courses: 8, products: 32, rating: 4.8, image: "https://randomuser.me/api/portraits/men/2.jpg" },
                { name: "Emma Rodriguez", specialty: "Digital Illustrator", courses: 15, products: 28, rating: 4.9, image: "https://randomuser.me/api/portraits/women/3.jpg" },
                { name: "David Kim", specialty: "Ceramic Artist", courses: 6, products: 67, rating: 4.7, image: "https://randomuser.me/api/portraits/men/4.jpg" },
              ].map((artist, index) => (
                <Card key={artist.name} hover className="p-6 text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="relative inline-block mb-4">
                    <img src={artist.image} alt={artist.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--secondary-500)] rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                      ✓
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">{artist.name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3">{artist.specialty}</p>
                  <div className="flex justify-center gap-4 text-xs text-[var(--muted-foreground)] mb-3">
                    <span>{artist.courses} Courses</span>
                    <span>•</span>
                    <span>{artist.products} Artworks</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-[var(--primary-500)] fill-[var(--primary-500)]" />
                    <span className="font-semibold">{artist.rating}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button variant="outline" asChild>
              <Link href="/artists">View All Artists <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How Core Creator Works</h2>
            <p className="text-[var(--muted-foreground)]">Whether you want to learn, shop, or create — getting started is simple</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* For Learners */}
            <Card className="p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">For Learners</h3>
              <ul className="space-y-3 text-[var(--muted-foreground)]">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <span>Browse 2,500+ courses across all art forms</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <span>Enroll and learn at your own pace</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <span>Earn certificates and showcase your skills</span>
                </li>
              </ul>
              <Button className="mt-6 w-full" asChild>
                <Link href="/learn">Start Learning</Link>
              </Button>
            </Card>

            {/* For Shoppers */}
            <Card className="p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full" />
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">For Art Collectors</h3>
              <ul className="space-y-3 text-[var(--muted-foreground)]">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <span>Discover 100K+ authentic artworks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <span>Buy directly from verified artists</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <span>Get worldwide shipping with tracking</span>
                </li>
              </ul>
              <Button className="mt-6 w-full bg-amber-500 hover:bg-amber-600" asChild>
                <Link href="/marketplace">Shop Now</Link>
              </Button>
            </Card>

            {/* For Creators */}
            <Card className="p-8 relative overflow-hidden group border-2 border-[var(--secondary-200)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--secondary-500)]/20 to-transparent rounded-bl-full" />
              <div className="absolute top-4 right-4 px-2 py-1 bg-[var(--secondary-100)] text-[var(--secondary-700)] text-xs font-semibold rounded-full">Most Popular</div>
              <div className="w-16 h-16 rounded-2xl bg-[var(--secondary-100)] flex items-center justify-center mb-6">
                <Palette className="w-8 h-8 text-[var(--secondary-600)]" />
              </div>
              <h3 className="text-xl font-bold mb-4">For Creators</h3>
              <ul className="space-y-3 text-[var(--muted-foreground)]">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--secondary-100)] text-[var(--secondary-600)] flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <span>Create and upload your courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--secondary-100)] text-[var(--secondary-600)] flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <span>List and sell your artwork globally</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--secondary-100)] text-[var(--secondary-600)] flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <span>Earn 85% revenue, withdraw anytime</span>
                </li>
              </ul>
              <Button variant="secondary" className="mt-6 w-full" asChild>
                <Link href="/studio/register">Become a Creator</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>



      {/* Testimonials */}
      <section className="py-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Community Says</h2>
            <p className="text-[var(--muted-foreground)]">Join thousands of satisfied learners and artists</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: `Core Creator helped me turn my hobby into a full-time career. I've earned over ${formatPrice(1000000)} teaching watercolor!`, name: "Priya Sharma", role: "Watercolor Instructor", image: "https://randomuser.me/api/portraits/women/32.jpg" },
              { quote: "The courses here are phenomenal. I learned digital illustration from scratch and now work as a freelancer.", name: "Rahul Verma", role: "Student & Freelancer", image: "https://randomuser.me/api/portraits/men/45.jpg" },
              { quote: "As an art collector, I love the variety and quality. Every piece I've bought has exceeded expectations!", name: "Anjali Mehta", role: "Art Collector", image: "https://randomuser.me/api/portraits/women/68.jpg" },
            ].map((testimonial, index) => (
              <Card key={testimonial.name} className="p-6 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-[var(--primary-500)] fill-[var(--primary-500)]" />
                  ))}
                </div>
                <p className="text-[var(--muted-foreground)] mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-[var(--neutral-900)] text-white">
        <div className="container-app">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Why Choose Core Creator?</h2>
              <p className="text-white/70 text-lg mb-8">
                We're building the most comprehensive platform for the art & craft ecosystem — connecting creators, learners, and collectors worldwide.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Award, title: "Quality Verified", desc: "Every course and artwork is vetted for quality" },
                  { icon: Users, title: "50K+ Community", desc: "Join a thriving creative community" },
                  { icon: Globe, title: "Global Reach", desc: "Sell and learn from anywhere in the world" },
                  { icon: Sparkles, title: "Fair Pricing", desc: "Creators keep 85% of their earnings" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-[var(--primary-400)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-white/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card className="p-6 bg-white/10 border-white/10">
                    <p className="text-4xl font-bold text-[var(--primary-400)]">2,500+</p>
                    <p className="text-white/60">Courses & Workshops</p>
                  </Card>
                  <Card className="p-6 bg-white/10 border-white/10">
                    <p className="text-4xl font-bold text-[var(--primary-400)]">{formatPrice(54695, "INR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}+</p>
                    <p className="text-white/60">Creator Earnings</p>
                  </Card>
                </div>
                <div className="space-y-4 pt-8">
                  <Card className="p-6 bg-white/10 border-white/10">
                    <p className="text-4xl font-bold text-[var(--primary-400)]">100K+</p>
                    <p className="text-white/60">Artworks Listed</p>
                  </Card>
                  <Card className="p-6 bg-white/10 border-white/10">
                    <p className="text-4xl font-bold text-[var(--primary-400)]">500K+</p>
                    <p className="text-white/60">Happy Learners</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container-app">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-gold" />
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center text-white">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">Ready to Start Your Creative Journey?</h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">Join thousands of artists, learners, and art lovers on the world's most vibrant creative platform.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="xl" className="bg-white text-[var(--foreground)] hover:bg-white/90 w-full sm:w-auto font-semibold" asChild>
                  <Link href="/register">Create Free Account<ArrowRight className="w-5 h-5 ml-2" /></Link>
                </Button>
                <Button variant="outline" size="xl" className="border-white text-white hover:bg-white/10 w-full sm:w-auto" asChild>
                  <Link href="/marketplace">Explore Marketplace</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

