import { Header, Footer } from "@/components/organisms";
import { Plus, Minus, Search } from "lucide-react";
import { commissionFaqAnswer } from "@/lib/commission";

export const metadata = {
    title: "FAQs | Core Creator",
    description: "Answers to common questions about buying, selling, and teaching on Core Creator — fees, payouts, refunds, and more.",
    alternates: { canonical: "/faqs" },
};

const faqs = [
    {
        category: "General",
        items: [
            { q: "What is Core Creator?", a: "Core Creator is a global marketplace and e-learning platform dedicated to art and craft. We connect artists, teachers, and learners from all over the world." },
            { q: "Is Core Creator free to use?", a: "Signing up and browsing is completely free. We charge a small fee only when you sell a product or course." },
            { q: "Can I use Core Creator on mobile?", a: "Yes! Our platform is fully responsive and optimized for all devices, so you can learn or manage your shop on the go." },
        ]
    },
    {
        category: "For Selling",
        items: [
            { q: "How do I start selling?", a: "Simply sign up for a Studio account, complete your profile, and start listing your artworks or courses. It takes less than 5 minutes to get started." },
            { q: "What are the fees?", a: commissionFaqAnswer() },
            { q: "How do I get paid?", a: "We support payouts via bank transfer and PayPal. Payouts are processed weekly for all completed orders." },
        ]
    },
    {
        category: "For Learning",
        items: [
            { q: "Do courses expire?", a: "No. Once you purchase a course, you have lifetime access to it, including any future updates." },
            { q: "Can I get a refund?", a: "Digital purchases — courses, tutorials and downloads — are final and non-refundable, because you get access immediately on payment. Most courses include a free preview lesson, so do watch that first. Physical items can be returned or replaced within 7 days of delivery if they arrive damaged or you receive the wrong product. Customized or personalized items can't be returned or replaced at all. See our Returns & Refunds page for full details." },
        ]
    }
];

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />
            <main id="main-content">

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Frequently Asked <span className="text-gradient">Questions</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8">
                        Can't find the answer you're looking for? Reach out to our support team.
                    </p>
                    <div className="relative max-w-lg mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                        />
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-4xl">
                    <div className="space-y-12">
                        {faqs.map((section, i) => (
                            <div key={i}>
                                <h2 className="text-2xl font-bold mb-6 border-b border-[var(--border)] pb-2">{section.category}</h2>
                                <div className="space-y-4">
                                    {section.items.map((item, j) => (
                                        <details key={j} className="group bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
                                            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-medium hover:bg-[var(--secondary-50)] transition-colors">
                                                {item.q}
                                                <span className="text-[var(--primary-600)] transition-transform group-open:rotate-45">
                                                    <Plus className="w-5 h-5 block group-open:hidden" />
                                                    <Minus className="w-5 h-5 hidden group-open:block" />
                                                </span>
                                            </summary>
                                            <div className="px-6 pb-6 text-[var(--muted-foreground)]">
                                                {item.a}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            </main>
            <Footer />
        </div>
    );
}
