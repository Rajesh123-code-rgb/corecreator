import { Header, Footer } from "@/components/organisms";
import { Truck, Globe, Clock, AlertCircle } from "lucide-react";

export const metadata = {
    title: "Shipping Information",
    description: "Shipping timelines, costs, and policies for physical artworks and products purchased on Core Creator.",
    alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />
            <main id="main-content">

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
                    <div className="prose prose-lg max-w-none">

                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Domestic Shipping</h3>
                                <p className="text-[var(--muted-foreground)]">
                                    Orders ship from the creator who made the piece, so delivery time depends on
                                    where they are based. The estimated cost is shown at checkout, and you&apos;ll
                                    get tracking details once the parcel is dispatched.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 mb-8">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Shipping Outside India</h3>
                                <p className="text-[var(--muted-foreground)]">
                                    Not every creator ships internationally. Where a piece can be sent abroad, the
                                    destinations and cost are shown at checkout before you pay. Any customs duties
                                    or import taxes are set by the destination country and are payable by the buyer.
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
                                    Most pieces are handmade or made to order, so the creator needs time to
                                    prepare your order before it ships. You&apos;ll receive tracking details as soon
                                    as it leaves their studio.
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

            </main>
            <Footer />
        </div>
    );
}
