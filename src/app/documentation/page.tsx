import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import Link from "next/link";
import { Book, Palette, Users, ArrowRight } from "lucide-react";

export default function DocumentationHubPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <main className="pt-32 pb-20 container-app">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Documentation & <span className="text-gradient">Guides</span></h1>
                    <p className="text-xl text-[var(--muted-foreground)]">
                        Everything you need to know about using Core Creator, whether you are learning, buying, or selling.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* User Guide Card */}
                    <div className="group relative bg-[var(--card)] rounded-3xl border border-[var(--border)] p-8 hover:shadow-2xl hover:border-[var(--secondary-500)] transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <Users className="w-32 h-32" />
                        </div>

                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                            <Book className="w-7 h-7" />
                        </div>

                        <h2 className="text-2xl font-bold mb-3">User Guide</h2>
                        <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
                            Complete guide for learners and shoppers. Learn how to manage your account, track orders, access courses, and discover amazing artwork.
                        </p>

                        <Button asChild className="w-full sm:w-auto" variant="outline">
                            <Link href="/documentation/user">
                                Read User Guide <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>

                    {/* Studio Guide Card */}
                    <div className="group relative bg-[var(--card)] rounded-3xl border border-[var(--border)] p-8 hover:shadow-2xl hover:border-[var(--secondary-500)] transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <Palette className="w-32 h-32" />
                        </div>

                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                            <Palette className="w-7 h-7" />
                        </div>

                        <h2 className="text-2xl font-bold mb-3">Studio Guide</h2>
                        <p className="text-[var(--muted-foreground)] mb-8 leading-relaxed">
                            Essential documentation for artists and instructors. Master product listings, course creation, order fulfillment, and payout management.
                        </p>

                        <Button asChild className="w-full sm:w-auto">
                            <Link href="/documentation/studio">
                                Read Studio Guide <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-20 text-center bg-[var(--muted)]/50 rounded-2xl p-8 max-w-2xl mx-auto">
                    <h3 className="text-xl font-semibold mb-2">Looking for something else?</h3>
                    <p className="text-[var(--muted-foreground)] mb-6">Check our Frequently Asked Questions for quick answers.</p>
                    <Link href="/help" className="text-[var(--primary-600)] font-medium hover:underline">
                        Visit Help Center &rarr;
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
