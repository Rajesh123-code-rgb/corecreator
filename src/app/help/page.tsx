"use client";

import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Search, Book, User, CreditCard, Shield, Truck, Settings, MessageCircle, ChevronLeft, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Types
type CategoryId = "getting-started" | "account" | "billing" | "safety" | "shipping" | "tech-support";

interface Article {
    id: string;
    question: string;
    answer: string;
}

interface Category {
    id: CategoryId;
    icon: any;
    title: string;
    description: string;
    articles: Article[];
}

// Data
const helpCategories: Category[] = [
    {
        id: "getting-started",
        icon: Book,
        title: "Getting Started",
        description: "Learn the basics of exploring, buying, and selling on Core Creator.",
        articles: [
            { id: "gs-1", question: "What is Core Creator?", answer: "Core Creator is a premier global marketplace and e-learning platform connecting artists, crafters, and learners. You can buy unique handmade items, sell your own creations, or take comprehensive courses to master new skills." },
            { id: "gs-2", question: "How do I create an account?", answer: "Click the 'Sign Up' button in the top right corner. You can register as a Learner/Buyer or apply for a Studio account if you wish to sell products and courses." },
            { id: "gs-3", question: "Is it free to join?", answer: "Yes! Browsing the marketplace, reading the blog, and creating a standard account are completely free. You only pay when you purchase a product or course, or when you make a sale as a creator." },
        ]
    },
    {
        id: "account",
        icon: User,
        title: "Account & Profile",
        description: "Manage your account settings, password, and public profile.",
        articles: [
            { id: "acc-1", question: "How do I reset my password?", answer: "Go to the Login page and click 'Forgot Password'. Enter your email address, and we'll send you a link to create a new password." },
            { id: "acc-2", question: "Can I change my username?", answer: "Yes, you can update your display name in your Profile Settings. However, your unique handle (URL) can only be changed once every 30 days." },
            { id: "acc-3", question: "How do I delete my account?", answer: "We'd be sad to see you go! You can request account deletion from the 'Privacy & Security' section of your Settings page. Please note this action is permanent." },
        ]
    },
    {
        id: "billing",
        icon: CreditCard,
        title: "Billing & Payments",
        description: "Understand fees, payouts, invoices, and payment methods.",
        articles: [
            { id: "bil-1", question: "What payment methods do you accept?", answer: "We securely accept all major credit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay." },
            { id: "bil-2", question: "When will I be charged?", answer: "You are charged immediately upon checking out for products or courses. You will receive an email receipt for your records." },
            { id: "bil-3", question: "How do payouts work for sellers?", answer: "Sellers receive payouts on a weekly basis for all completed orders. Funds are transferred directly to your connected bank account or PayPal." },
            { id: "bil-4", question: "Are there transaction fees?", answer: "We charge a standard 10% platform fee on sales to cover hosting, marketing, and payment processing costs. There are no listing fees." },
        ]
    },
    {
        id: "safety",
        icon: Shield,
        title: "Safety & Privacy",
        description: "Learn about our security measures and how we protect your data.",
        articles: [
            { id: "saf-1", question: "Is my payment information secure?", answer: "Absolutely. We use industry-standard encryption and do not store your full credit card details on our servers. All payments are processed by our secure verified partners." },
            { id: "saf-2", question: "How do I report a suspicious user?", answer: "If you encounter suspicious behavior, navigate to the user's profile and click the 'Report' button, or use our 'Report an Issue' page in the footer." },
            { id: "saf-3", question: "What is 2-Factor Authentication?", answer: "2FA adds an extra layer of security. We recommend enabling it in your Security settings to require a code from your phone whenever you log in from a new device." },
        ]
    },
    {
        id: "shipping",
        icon: Truck,
        title: "Shipping & Delivery",
        description: "Guides on shipping zones, tracking, and delivery estimates.",
        articles: [
            { id: "shp-1", question: "How do I track my order?", answer: "Once your order ships, you'll receive an email with a tracking number. You can also view real-time tracking from your 'Order History' page." },
            { id: "shp-2", question: "Do you ship internationally?", answer: "Yes! Many of our artists ship worldwide. Shipping availability and costs are calculated at checkout based on your location and the seller's settings." },
            { id: "shp-3", question: "What if my package is lost?", answer: "If your package hasn't arrived within the estimated window, check the tracking status first. If it appears lost, contact the seller directly or reach out to our support team for mediation." },
        ]
    },
    {
        id: "tech-support",
        icon: Settings,
        title: "Technical Support",
        description: "Troubleshooting for site issues, browser compatibility, and bugs.",
        articles: [
            { id: "tec-1", question: "The site isn't loading correctly.", answer: "Please try clearing your browser cache and cookies, or try accessing the site from a different browser. If the issue persists, check our status page or contact support." },
            { id: "tec-2", question: "I can't upload images to my shop.", answer: "Ensure your images are under 5MB and are in JPG or PNG format. If you continue to have trouble, try refreshing the page or using a different internet connection." },
            { id: "tec-3", question: "Where do I find my course purchases?", answer: "All purchased courses are available in your 'My Learning' dashboard. You have lifetime access to them." },
        ]
    },
];

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);

    // Filter logic
    const filteredCategories = searchQuery
        ? helpCategories.map(cat => ({
            ...cat,
            articles: cat.articles.filter(article =>
                article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.answer.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.articles.length > 0)
        : helpCategories;

    const activeCategoryData = selectedCategory ? helpCategories.find(c => c.id === selectedCategory) : null;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero */}
            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">How can we <span className="text-gradient">help?</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8">
                        Search our knowledge base or browse categories below.
                    </p>
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedCategory(null); // Reset category selection on search
                            }}
                            placeholder="Search for answers (e.g., 'refund', 'tracking')"
                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] shadow-lg"
                        />
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20 container-app min-h-[500px]">

                {/* State: Searching */}
                {searchQuery && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold mb-6">Search Results</h2>
                        {filteredCategories.length === 0 ? (
                            <div className="text-center py-10 bg-[var(--card)] rounded-xl border border-[var(--border)]">
                                <p className="text-[var(--muted-foreground)]">No results found for "{searchQuery}". Try a different keyword.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {filteredCategories.map((cat) => (
                                    <div key={cat.id}>
                                        <h3 className="font-bold text-[var(--primary-600)] mb-3 flex items-center gap-2">
                                            <cat.icon className="w-5 h-5" /> {cat.title}
                                        </h3>
                                        <div className="space-y-4">
                                            {cat.articles.map((article) => (
                                                <ArticleItem key={article.id} article={article} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* State: Category Selected */}
                {!searchQuery && selectedCategory && activeCategoryData && (
                    <div className="max-w-3xl mx-auto animate-fade-in-up">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Categories
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-[var(--secondary-50)] rounded-2xl flex items-center justify-center text-[var(--secondary-600)]">
                                <activeCategoryData.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">{activeCategoryData.title}</h2>
                                <p className="text-[var(--muted-foreground)]">{activeCategoryData.description}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {activeCategoryData.articles.map((article) => (
                                <ArticleItem key={article.id} article={article} />
                            ))}
                        </div>
                    </div>
                )}

                {/* State: Category List (Default) */}
                {!searchQuery && !selectedCategory && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {helpCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className="group text-left p-8 rounded-2xl border border-[var(--border)] hover:border-[var(--primary-500)] hover:shadow-xl transition-all bg-[var(--card)]"
                            >
                                <div className="w-14 h-14 bg-[var(--secondary-50)] rounded-2xl flex items-center justify-center mb-6 text-[var(--secondary-600)] group-hover:scale-110 transition-transform">
                                    <cat.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-xl mb-3 group-hover:text-[var(--primary-600)] transition-colors">{cat.title}</h3>
                                <p className="text-[var(--muted-foreground)] leading-relaxed mb-6">{cat.description}</p>
                                <div className="flex items-center text-sm font-medium text-[var(--primary-600)] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                    View Articles <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA */}
            <section className="py-20 bg-[var(--muted)]/50">
                <div className="container-app text-center">
                    <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
                    <p className="text-[var(--muted-foreground)] mb-8">Our support team is available 24/7 to assist you.</p>
                    <div className="flex justify-center gap-4">
                        <Button asChild>
                            <Link href="/contact"><MessageCircle className="w-4 h-4 mr-2" /> Contact Support</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

function ArticleItem({ article }: { article: Article }) {
    return (
        <details className="group bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-medium hover:bg-[var(--secondary-50)] transition-colors">
                {article.question}
                <span className="text-[var(--primary-600)] transition-transform group-open:rotate-180">
                    <ChevronDownIcon />
                </span>
            </summary>
            <div className="px-6 pb-6 text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-4 bg-[var(--neutral-50)]/50">
                {article.answer}
            </div>
        </details>
    )
}

function ChevronDownIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}
