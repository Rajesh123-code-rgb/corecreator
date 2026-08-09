import { Header, Footer } from "@/components/organisms";
import { RefreshCcw, ShieldCheck, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/atoms";

export const metadata = {
    title: "Returns & Refunds",
    description: "Our refund guarantee for digital courses and return policy for physical artworks and products.",
    alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />
            <main id="main-content">

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Returns & <span className="text-gradient">Refunds</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        Our goal is your complete satisfaction. Learn about our guarantee and return process.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-3xl">
                    <div className="space-y-12">

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <RefreshCcw className="w-6 h-6 text-blue-600" />
                                Physical Artworks &amp; Products
                            </h2>
                            <p className="text-[var(--muted-foreground)] leading-relaxed mb-4">
                                Physical items can be returned or replaced within <strong>7 days of delivery</strong>,
                                and only in these cases:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-[var(--muted-foreground)]">
                                <li><strong>Damaged item</strong> — the piece arrived broken or damaged in transit.</li>
                                <li><strong>Wrong item</strong> — what arrived doesn&apos;t match what you ordered.</li>
                            </ul>
                            <p className="text-[var(--muted-foreground)] leading-relaxed mt-4">
                                We don&apos;t accept change-of-mind returns. Please check the listing details,
                                dimensions and photographs carefully before ordering.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-amber-600" />
                                Customized &amp; Personalized Items
                            </h2>
                            <p className="text-[var(--muted-foreground)] leading-relaxed">
                                Customized and personalized products <strong>cannot be returned or replaced</strong>,
                                including for damage or mismatch. These pieces are made specifically to your
                                order and can&apos;t be resold, so please confirm every detail of your
                                customization before completing your purchase.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-slate-600" />
                                Digital Courses, Tutorials &amp; Downloads
                            </h2>
                            <p className="text-[var(--muted-foreground)] leading-relaxed">
                                All digital purchases are <strong>final</strong>. Because course content and
                                downloads are accessible immediately after payment, we don&apos;t offer refunds
                                or returns on them. Most courses include a free preview lesson — we&apos;d
                                encourage you to watch it before buying.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-purple-600" />
                                How to Request a Return
                            </h2>
                            <ol className="list-decimal pl-6 space-y-4 text-[var(--muted-foreground)]">
                                <li>Within 7 days of delivery, go to your <strong>Order History</strong> in your account dashboard.</li>
                                <li>Select the order containing the item you wish to return.</li>
                                <li>Click <strong>&quot;Request Refund/Return&quot;</strong> and select the reason (damaged or wrong item).</li>
                                <li>The artist or our support team will review your request within 48 hours.</li>
                            </ol>
                        </section>

                        <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] text-center">
                            <h3 className="font-bold text-lg mb-2">Need help with a return?</h3>
                            <p className="text-[var(--muted-foreground)] mb-6">If you're having trouble with a seller or need assistance, our support team is here to mediate.</p>
                            <Button variant="outline" asChild>
                                <Link href="/contact"><Mail className="w-4 h-4 mr-2" /> Contact Support</Link>
                            </Button>
                        </div>

                    </div>
                </div>
            </section>

            </main>
            <Footer />
        </div>
    );
}
