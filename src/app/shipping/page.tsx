import { Header, Footer } from "@/components/organisms";
import { Truck, Globe, Clock, AlertCircle } from "lucide-react";

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Shipping <span className="text-gradient">Information</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        Everything you need to know about delivery times, rates, and international shipping.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert max-w-none">

                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Domestic Shipping</h3>
                                <p className="text-[var(--muted-foreground)]">
                                    For orders within the same country, standard shipping typically takes 3-5 business days. Expedited options are available at checkout for most items, delivering within 1-2 business days.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">International Shipping</h3>
                                <p className="text-[var(--muted-foreground)]">
                                    Core Creator connects you with artists globally. International shipping times vary by destination but generally range from 7-14 business days. Please note that customs duties and taxes may apply upon arrival and are the responsibility of the buyer.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Processing Time</h3>
                                <p className="text-[var(--muted-foreground)]">
                                    Since many items on Core Creator are handmade or made-to-order, please allow 1-3 business days for artists to prepare your order before it ships. You will receive a tracking number as soon as your package leaves the studio.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[var(--secondary-50)] border border-[var(--secondary-100)] p-6 rounded-xl flex gap-4 mt-12">
                            <AlertCircle className="w-6 h-6 text-[var(--secondary-600)] flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-[var(--secondary-900)] mb-1">Digital Products</h4>
                                <p className="text-sm text-[var(--secondary-700)]">
                                    Courses, tutorials, and digital downloads are delivered instantly to your email and account library upon purchase. No shipping required!
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
