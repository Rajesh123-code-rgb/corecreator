
"use client";

import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { Header, Footer } from "@/components/organisms";
import { Map, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LearningPathsPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 gradient-mesh opacity-70" />
                <div className="container-app relative text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-6">Curated <span className="text-gradient">Learning Paths</span></h1>
                    <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
                        Structured step-by-step guides to take you from beginner to professional in your chosen craft.
                    </p>
                </div>
            </section>

            <section className="py-12 bg-[var(--muted)]">
                <div className="container-app">
                    <div className="min-h-[400px] rounded-3xl bg-[var(--neutral-900)] flex items-center justify-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-900)]/20 to-transparent" />
                        <div className="text-center p-8 relative z-10">
                            <Map className="w-16 h-16 mx-auto mb-6 text-[var(--primary-400)]" />
                            <h2 className="text-2xl font-bold mb-4">Paths Under Construction</h2>
                            <p className="max-w-md mx-auto mb-8 text-white/70">
                                We are designing comprehensive roadmaps for Watercolor, Digital Art, Pottery, and more.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button size="lg" variant="secondary" asChild>
                                    <Link href="/learn">Explore Courses</Link>
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
