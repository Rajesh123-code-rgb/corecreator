import { Header, Footer } from "@/components/organisms";
import { ChevronRight, ShoppingBag, BookOpen, Truck, Shield } from "lucide-react";
import Link from "next/link";

export default function UserDocumentationPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <div className="pt-24 pb-12 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                <div className="container-app">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                        <Link href="/documentation" className="hover:text-[var(--foreground)]">Documentation</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[var(--foreground)]">User Guide</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">User Account Guide</h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl">
                        Everything you need to navigate Core Creator as a learner or shopper.
                    </p>
                </div>
            </div>

            <main className="container-app py-16 grid lg:grid-cols-4 gap-12">
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block space-y-2 sticky top-24 h-fit">
                    <a href="#getting-started" className="block px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg">Getting Started</a>
                    <a href="#shopping" className="block px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors">Shopping & Orders</a>
                    <a href="#learning" className="block px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors">Learning Platform</a>
                    <a href="#account" className="block px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors">Account Security</a>
                </aside>

                {/* Content */}
                <div className="lg:col-span-3 space-y-16">

                    {/* Section 1 */}
                    <section id="getting-started" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <span className="font-bold">1</span>
                            </div>
                            <h2 className="text-2xl font-bold">Getting Started</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <p>
                                Welcome to Core Creator! As a user, you have access to a global marketplace of unique artworks and a world-class learning platform.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li><strong>Sign Up:</strong> Create a free account using your email or Google/Facebook login.</li>
                                <li><strong>Personalize:</strong> Update your profile with your interests to get tailored recommendations.</li>
                                <li><strong>Explore:</strong> Use the global search bar to find specific artists, products, or courses.</li>
                            </ul>
                        </div>
                    </section>

                    <hr className="border-[var(--border)]" />

                    {/* Section 2 */}
                    <section id="shopping" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Shopping & Orders</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <h3 className="text-[var(--foreground)] font-semibold text-lg mt-0 mb-3">Buying Artwork</h3>
                            <p>
                                Core Creator hosts thousands of verified artists. When you buy a product:
                            </p>
                            <ul className="list-disc pl-5 mt-2 mb-6">
                                <li>Add items to your cart from multiple artists.</li>
                                <li>Checkout securely using Credit Card, UPI, or PayPal.</li>
                                <li>Track your order status in real-time from your Dashboard.</li>
                            </ul>

                            <h3 className="text-[var(--foreground)] font-semibold text-lg mb-3">Shipping & Returns</h3>
                            <p>
                                Shipping rates are determined by individual artists based on their location and yours. Returns are handled according to the artist's policy, but Core Creator mediates disputes to ensure fair resolution.
                            </p>
                        </div>
                    </section>

                    <hr className="border-[var(--border)]" />

                    {/* Section 3 */}
                    <section id="learning" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Learning Platform</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <p>
                                Access your courses anytime, anywhere.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                                    <h4 className="font-semibold text-[var(--foreground)] mb-2">Lifetime Access</h4>
                                    <p className="text-sm">Once you buy a course, it's yours forever. Revisit lessons as often as you like.</p>
                                </div>
                                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                                    <h4 className="font-semibold text-[var(--foreground)] mb-2">Certificates</h4>
                                    <p className="text-sm">Complete all modules and assignments to earn a verified certificate of completion.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-[var(--border)]" />

                    {/* Section 4 */}
                    <section id="account" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Account Security</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <p>
                                Your security is our top priority. We recommend:
                            </p>
                            <ul className="list-disc pl-5 mt-4">
                                <li>Enable <strong>Two-Factor Authentication (2FA)</strong> in Settings.</li>
                                <li>Use a strong, unique password.</li>
                                <li>Check your active sessions regularly.</li>
                            </ul>
                            <p className="mt-4 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900">
                                <strong>Note:</strong> We will never ask for your password via email.
                            </p>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
