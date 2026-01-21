import { Header, Footer } from "@/components/organisms";
import { ChevronRight, Package, Video, BarChart3, CreditCard } from "lucide-react";
import Link from "next/link";

export default function StudioDocumentationPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <div className="pt-24 pb-12 bg-gradient-to-r from-purple-900/10 to-blue-900/10 border-b border-[var(--border)]">
                <div className="container-app">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                        <Link href="/documentation" className="hover:text-[var(--foreground)]">Documentation</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[var(--foreground)]">Studio Guide</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Studio Partner Guide</h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl">
                        Technical documentation for Artists, Instructors, and Sellers.
                    </p>
                </div>
            </div>

            <main className="container-app py-16 grid lg:grid-cols-4 gap-12">
                {/* Sidebar Navigation */}
                <aside className="hidden lg:block space-y-2 sticky top-24 h-fit">
                    <a href="#products" className="block px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg">Product Management</a>
                    <a href="#courses" className="block px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors">Course Creation</a>
                    <a href="#orders" className="block px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors">Orders & Fulfillment</a>
                    <a href="#payouts" className="block px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors">Payouts & Fees</a>
                </aside>

                {/* Content */}
                <div className="lg:col-span-3 space-y-16">

                    {/* Section 1 */}
                    <section id="products" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                <Package className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Product Management</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <p>
                                Manage your inventory and listings efficiently.
                            </p>
                            <h3 className="text-[var(--foreground)] font-semibold text-lg mt-4 mb-2">Guidelines for Listings</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Images:</strong> Upload high-resolution images (min 1080x1080). Use a clean background.</li>
                                <li><strong>SEO:</strong> Use descriptive titles and tags. Our AI automatically optimizes your URL and metadata.</li>
                                <li><strong>Pricing:</strong> Set competitive prices. You can run discounts and offers from the Marketing tab.</li>
                            </ul>
                        </div>
                    </section>

                    <hr className="border-[var(--border)]" />

                    {/* Section 2 */}
                    <section id="courses" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <Video className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Course Creation Studio</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <p>
                                The Course Studio helps you build structured learning experiences.
                            </p>
                            <div className="my-6 border-l-4 border-blue-500 pl-4 bg-blue-50 dark:bg-blue-900/20 py-2 pr-4 rounded-r-lg">
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    <strong>Pro Tip:</strong> Break your course into small, digestible chapters (5-10 mins video length) to maximize student engagement.
                                </p>
                            </div>
                            <h3 className="text-[var(--foreground)] font-semibold text-lg mb-2">Supported Content</h3>
                            <ul className="list-disc pl-5">
                                <li>HD Video Hosting (up to 4K)</li>
                                <li>Downloadable Resources (PDF, Zip)</li>
                                <li>Quizzes and Assignments</li>
                            </ul>
                        </div>
                    </section>

                    <hr className="border-[var(--border)]" />

                    {/* Section 3 */}
                    <section id="orders" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Orders & Fulfillment</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <p>
                                When you receive an order, you must fulfill it within your specified handling time.
                            </p>
                            <ol className="list-decimal pl-5 mt-4 space-y-2">
                                <li><strong>Acknowledge:</strong> Change order status to 'Processing'.</li>
                                <li><strong>Pack:</strong> Ensure secure packaging for fragile items.</li>
                                <li><strong>Ship:</strong> Generate shipping label via our integrated partners or use your own.</li>
                                <li><strong>Track:</strong> Update the order with the tracking number immediately.</li>
                            </ol>
                        </div>
                    </section>

                    <hr className="border-[var(--border)]" />

                    {/* Section 4 */}
                    <section id="payouts" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Payouts & Fees</h2>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-[var(--muted-foreground)]">
                            <p>
                                We believe in transparency. Here's how finances work on Core Creator.
                            </p>
                            <div className="overflow-x-auto mt-6">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            <th className="py-2 font-semibold">Fee Type</th>
                                            <th className="py-2 font-semibold">Amount</th>
                                            <th className="py-2 font-semibold">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-[var(--border)]">
                                            <td className="py-2 text-[var(--foreground)]">Platform Fee</td>
                                            <td className="py-2">10%</td>
                                            <td className="py-2">Applied to the sale price (excluding shipping). Covers hosting and marketing.</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 text-[var(--foreground)]">Payment Processing</td>
                                            <td className="py-2">~2.5%</td>
                                            <td className="py-2">Standard gateway charges.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-sm">
                                Payouts are bonded by a 7-day rolling window to account for returns and disputes. Funds are transferred weekly to your linked bank account.
                            </p>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
