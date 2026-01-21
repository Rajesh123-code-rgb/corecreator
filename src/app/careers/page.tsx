import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Briefcase, MapPin, Clock, ArrowRight, Zap, Coffee, Smile, Globe } from "lucide-react";
import Link from "next/link";



const perks = [
    { icon: Zap, title: "Fast-Paced Growth", description: "Join a startup that is scaling rapidly and transforming an industry." },
    { icon: Globe, title: "Remote-First", description: "Work from anywhere in the world. We value output over hours." },
    { icon: Coffee, title: "Learning Budget", description: "Annual stipend for courses, books, and conferences." },
    { icon: Smile, title: "Wellness Benefits", description: "Comprehensive health coverage and mental wellness support." },
];



export default function CareersPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero */}
            <section className="pt-32 pb-20 text-center">
                <div className="container-app">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Build the Future of <span className="text-gradient">Creativity</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
                        We're looking for passionate individuals to join our mission of empowering artists and learners worldwide.
                    </p>
                    <Button size="lg" asChild>
                        <a href="#open-positions">View Open Roles</a>
                    </Button>
                </div>
            </section>

            {/* Perks */}
            <section className="py-20 bg-[var(--muted)]">
                <div className="container-app">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Work With Us?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {perks.map((perk, i) => (
                            <div key={i} className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)]">
                                <div className="w-10 h-10 bg-[var(--secondary-100)] rounded-lg flex items-center justify-center mb-4 text-[var(--secondary-600)]">
                                    <perk.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold mb-2">{perk.title}</h3>
                                <p className="text-sm text-[var(--muted-foreground)]">{perk.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section id="open-positions" className="py-20 container-app">
                <h2 className="text-3xl font-bold mb-10">Open Positions</h2>
                <div className="text-center py-10 bg-[var(--card)] rounded-xl border border-[var(--border)] border-dashed">
                    <p className="text-lg text-[var(--muted-foreground)]">
                        We will update soon with upcoming openings.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
}
