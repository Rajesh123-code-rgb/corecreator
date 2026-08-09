import Link from "next/link";
import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { MessageSquare } from "lucide-react";

export const metadata = {
    title: "Community",
    description: "The Core Creator community forum is in the works.",
    alternates: { canonical: "/community" },
    // Nothing to index yet - keep this out of search results until the forum
    // actually exists.
    robots: { index: false, follow: true },
};

// This page previously rendered a full discussion forum - categories with topic
// counts, pinned threads, member/reply/online statistics - none of which was
// real. There is no forum backend (the Post model powers the blog), so every
// figure and every thread on it was hardcoded. Replaced with an honest
// placeholder until the feature is actually built.
export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <main id="main-content" className="pt-24 pb-16">
                <div className="container-app max-w-2xl text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--muted)] flex items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-[var(--muted-foreground)]" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3">Community is coming soon</h1>
                    <p className="text-[var(--muted-foreground)] mb-8">
                        We&apos;re building a space for creators and learners to share work, ask
                        questions and give feedback. It isn&apos;t open yet.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button variant="secondary" size="lg" asChild>
                            <Link href="/learn">Explore Courses</Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/marketplace">Browse Artworks</Link>
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
