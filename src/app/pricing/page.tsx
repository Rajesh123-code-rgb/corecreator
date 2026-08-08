import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { Percent, Wallet, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import {
    COMMISSION,
    isPromoActive,
    getCurrentCommissionPct,
    getCurrentCreatorSharePct,
} from "@/lib/commission";

export const metadata = {
    title: "Pricing & Fees | Core Creator",
    description: "See exactly what Core Creator charges creators and buyers — commission rate, payout schedule, and refund policy, all in one place.",
    alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
    const promoActive = isPromoActive();
    const currentPct = getCurrentCommissionPct();
    const currentSharePct = getCurrentCreatorSharePct();
    const promoEndLabel = COMMISSION.promoEndsAt.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />
            <main id="main-content">

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                        Pricing &amp; <span className="text-gradient">Fees</span>
                    </h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        One page, the real numbers. No hidden charges for buyers, one flat commission for creators.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-3xl">
                    <div className="space-y-12">

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Percent className="w-6 h-6 text-[var(--secondary-500)]" />
                                Commission
                            </h2>
                            {promoActive ? (
                                <p className="text-[var(--muted-foreground)] leading-relaxed">
                                    Our standard commission is <strong>{COMMISSION.standardRatePct}%</strong> per sale. As a
                                    limited-time launch offer, it&apos;s reduced to <strong>{COMMISSION.promoRatePct}%</strong> —
                                    meaning you keep <strong>{currentSharePct}%</strong> — for all sales through{" "}
                                    <strong>{promoEndLabel}</strong>. There are no monthly subscription fees and no listing fees.
                                </p>
                            ) : (
                                <p className="text-[var(--muted-foreground)] leading-relaxed">
                                    We take a flat <strong>{currentPct}%</strong> commission on sales — you keep{" "}
                                    <strong>{currentSharePct}%</strong> — to cover payment processing and platform
                                    maintenance. There are no monthly subscription fees and no listing fees.
                                </p>
                            )}
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Wallet className="w-6 h-6 text-blue-600" />
                                Payouts
                            </h2>
                            <p className="text-[var(--muted-foreground)] leading-relaxed">
                                Payouts are processed <strong>weekly</strong> for all completed orders, via bank transfer or
                                PayPal.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                                Refunds
                            </h2>
                            <ul className="list-disc pl-6 space-y-2 text-[var(--muted-foreground)]">
                                <li>
                                    <strong>Digital courses &amp; tutorials:</strong> final sale — no refunds or
                                    returns, since access is granted immediately on payment.
                                </li>
                                <li>
                                    <strong>Physical artworks &amp; products:</strong> return or replacement within
                                    7 days of delivery, for damaged or wrong items only. No change-of-mind returns.
                                </li>
                                <li>
                                    <strong>Customized &amp; personalized items:</strong> not returnable or
                                    replaceable.
                                </li>
                            </ul>
                        </section>

                        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                            <table className="w-full text-left border-collapse">
                                <tbody className="divide-y divide-[var(--border)]">
                                    <tr>
                                        <td className="p-4 font-semibold">Platform commission</td>
                                        <td className="p-4 text-[var(--muted-foreground)]">
                                            {currentPct}% per sale{promoActive ? ` (launch offer, through ${promoEndLabel})` : ""}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold">Monthly / listing fees</td>
                                        <td className="p-4 text-[var(--muted-foreground)]">None</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold">Payout schedule</td>
                                        <td className="p-4 text-[var(--muted-foreground)]">Weekly, for all completed orders</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold">Payout methods</td>
                                        <td className="p-4 text-[var(--muted-foreground)]">Bank transfer or PayPal</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold">Refunds — digital</td>
                                        <td className="p-4 text-[var(--muted-foreground)]">Final sale, no refunds</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-semibold">Refunds — physical</td>
                                        <td className="p-4 text-[var(--muted-foreground)]">7-day return/replacement, damaged or wrong item only</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] text-center">
                            <h3 className="font-bold text-lg mb-2">Have questions?</h3>
                            <p className="text-[var(--muted-foreground)] mb-6">
                                See our <Link href="/faqs" className="underline">FAQ</Link> or reach out directly.
                            </p>
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
