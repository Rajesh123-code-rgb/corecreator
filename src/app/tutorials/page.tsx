
"use client";

import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { Header, Footer } from "@/components/organisms";
import { Play, Calendar, Video, ArrowRight, Star } from "lucide-react";

export default function TutorialsPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 gradient-mesh opacity-70" />
                <div className="container-app relative text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-6">Free Creative <span className="text-gradient">Tutorials</span></h1>
                    <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
                        Bite-sized lessons to help you get started with a new skill or master a specific technique.
                    </p>
                </div>
            </section>

            {/* List */}
            <section className="py-12 bg-[var(--muted)]">
                <div className="container-app">
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-[var(--neutral-900)] flex items-center justify-center text-white">
                        <div className="text-center p-8">
                            <Video className="w-16 h-16 mx-auto mb-6 text-[var(--secondary-400)]" />
                            <h2 className="text-2xl font-bold mb-4">Tutorial Library Coming Soon!</h2>
                            <p className="max-w-md mx-auto mb-8 text-white/70">
                                We are curating hundreds of free video tutorials from our top instructors. Stay tuned for the launch.
                            </p>
                            <Button size="lg" asChild>
                                <Link href="/learn">Browse Full Courses</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
