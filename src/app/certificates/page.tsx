
"use client";

import Link from "next/link";
import { Button } from "@/components/atoms";
import { Header, Footer } from "@/components/organisms";
import { Award, ArrowRight, ShieldCheck, Download, Play } from "lucide-react";

export default function CertificatesPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 gradient-mesh opacity-70" />
                <div className="container-app relative text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-6">Earn Recognized <span className="text-gradient">Certificates</span></h1>
                    <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10">
                        Showcase your skills with verified certificates upon completing courses on Core Creator.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button size="xl" asChild>
                            <Link href="/user/certificates">View My Certificates</Link>
                        </Button>
                        <Button size="xl" variant="outline" asChild>
                            <Link href="/learn">Start Learning</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 bg-[var(--muted)]">
                <div className="container-app">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[var(--background)] p-8 rounded-2xl border border-[var(--border)]">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <Play className="w-7 h-7 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">1. Complete a Course</h3>
                            <p className="text-[var(--muted-foreground)]">Watch all lessons and complete assignments in any certificate-eligible course.</p>
                        </div>
                        <div className="bg-[var(--background)] p-8 rounded-2xl border border-[var(--border)]">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">2. Get Verified</h3>
                            <p className="text-[var(--muted-foreground)]">Your progress is automatically tracked and verified by our system.</p>
                        </div>
                        <div className="bg-[var(--background)] p-8 rounded-2xl border border-[var(--border)]">
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                                <Download className="w-7 h-7 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">3. Download & Share</h3>
                            <p className="text-[var(--muted-foreground)]">Instantly download your certificate and display it on your LinkedIn profile.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Play component helper needed */}

            <Footer />
        </div>
    );
}


