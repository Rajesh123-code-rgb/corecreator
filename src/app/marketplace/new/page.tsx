
"use client";

import Link from "next/link";
import { Button } from "@/components/atoms";
import { Header, Footer } from "@/components/organisms";
import { Sparkles } from "lucide-react";

export default function NewArrivalsPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />
            <section className="pt-32 pb-20 container-app text-center">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6">New <span className="text-gradient">Arrivals</span></h1>
                <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
                    Be the first to discover the latest artworks added to our collection.
                </p>
            </section>
            <section className="py-12 bg-[var(--muted)]">
                <div className="container-app text-center py-20">
                    <Sparkles className="w-16 h-16 mx-auto mb-6 text-amber-500" />
                    <h2 className="text-2xl font-bold mb-4">Latest Collections Loading...</h2>
                    <Button size="lg" asChild>
                        <Link href="/marketplace?sort=newest">View Newest Items</Link>
                    </Button>
                </div>
            </section>
            <Footer />
        </div>
    );
}
