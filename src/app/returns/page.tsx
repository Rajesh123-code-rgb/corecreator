import { Header, Footer } from "@/components/organisms";
import { RefreshCcw, ShieldCheck, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/atoms";

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

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
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                                30-Day Money-Back Guarantee
                            </h2>
                            <p className="text-[var(--muted-foreground)] leading-relaxed">
                                For clear peace of mind, we offer a 30-day money-back guarantee on all **Digital Courses** and **Tutorials**. If you're not learning what you expected, simply request a refund within 30 days of purchase for a full refund.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <RefreshCcw className="w-6 h-6 text-blue-600" />
                                Physical Artworks & Products
                            </h2>
                            <p className="text-[var(--muted-foreground)] leading-relaxed mb-4">
                                Because many artworks are unique or made-to-order, return policies for physical goods are set by the individual artist. However, Core Creator enforces a minimum standard:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-[var(--muted-foreground)]">
                                <li>**Damaged or Incorrect Items**: You are always entitled to a full refund or replacement if your item arrives damaged or is not as described.</li>
                                <li>**Change of Mind**: Individual artist policies apply. Please check the "Returns" tab on the product page before purchasing.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-purple-600" />
                                How to Request a Return
                            </h2>
                            <ol className="list-decimal pl-6 space-y-4 text-[var(--muted-foreground)]">
                                <li>Go to your **Order History** in your account dashboard.</li>
                                <li>Select the order containing the item you wish to return.</li>
                                <li>Click **"Request Refund/Return"** and select the reason.</li>
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

            <Footer />
        </div>
    );
}
