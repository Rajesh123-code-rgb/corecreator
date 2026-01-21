
"use client";

import Link from "next/link";
import { Button } from "@/components/atoms";
import { Header, Footer } from "@/components/organisms";
import { TrendingUp } from "lucide-react";

export default function BestSellersPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />
            <section className="pt-32 pb-20 container-app text-center">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6">Best <span className="text-gradient">Sellers</span></h1>
                <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
                    The most popular and highly-rated artworks loved by our community.
                </p>
            </section>
            <section className="py-12 bg-[var(--muted)]">
                <div className="container-app text-center py-20">
                    <TrendingUp className="w-16 h-16 mx-auto mb-6 text-green-500" />
                    <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
                    <Button size="lg" asChild>
                        <Link href="/marketplace?sort=popular">View Popular Items</Link>
                    </Button>
                </div>
            </section>
            <Footer />
        </div>
    );
}
