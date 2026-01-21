import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Users, Target, Heart, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
                <div className="container-app relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                            Empowering <span className="text-gradient">Creativity</span> Globally
                        </h1>
                        <p className="text-lg text-[var(--muted-foreground)] mb-8 leading-relaxed">
                            Core Creator is more than just a platform; it's a movement. We are dedicated to bridging the gap between learning arts and building a sustainable career in the creative industry.
                        </p>
                    </div>
                </div>
                {/* Background elements */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full" />
            </section>

            {/* Mission Section */}
            <section className="py-20 bg-[var(--muted)]">
                <div className="container-app">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)]">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                            <p className="text-[var(--muted-foreground)]">
                                To democratize art education and provide a global marketplace where creators can thrive financially and artistically.
                            </p>
                        </div>
                        <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)]">
                            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6 text-pink-600">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Our Values</h3>
                            <p className="text-[var(--muted-foreground)]">
                                We believe in authenticity, community support, and the transformative power of continuous learning.
                            </p>
                        </div>
                        <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)]">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Global Reach</h3>
                            <p className="text-[var(--muted-foreground)]">
                                Connecting artists from over 100 countries, fostering cultural exchange through the universal language of art.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20">
                <div className="container-app">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-[var(--primary-600)] mb-2">50K+</div>
                            <div className="text-sm text-[var(--muted-foreground)]">Active Creators</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[var(--primary-600)] mb-2">100+</div>
                            <div className="text-sm text-[var(--muted-foreground)]">Countries</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[var(--primary-600)] mb-2">2.5M</div>
                            <div className="text-sm text-[var(--muted-foreground)]">Lessons Watched</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[var(--primary-600)] mb-2">$10M+</div>
                            <div className="text-sm text-[var(--muted-foreground)]">Paid to Artists</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900 text-white text-center">
                <div className="container-app">
                    <h2 className="text-3xl font-bold mb-6">Join the Movement</h2>
                    <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                        Whether you want to learn a new skill, share your expertise, or collect unique art, there's a place for you here.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100" asChild>
                            <Link href="/register">Get Started</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                            <Link href="/careers">Work With Us</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
