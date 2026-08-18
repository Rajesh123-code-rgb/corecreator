"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/formatDate";
import { useToast } from "@/components/molecules";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header, Footer } from "@/components/organisms";
import { Button, Input, ImageWithFallback } from "@/components/atoms";
import { useCurrency } from "@/context/CurrencyContext";
import { applyTax, DIGITAL_SERVICE_GST_RATE } from "@/lib/tax";
import { Loader2, ArrowLeft, CreditCard, Shield, Users, Calendar, Clock } from "lucide-react";

interface Workshop {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail: string;
    date: string;
    duration: number;
}

export default function WorkshopCheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { formatPrice } = useCurrency();

    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [loading, setLoading] = useState(true);
    const [seats, setSeats] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const toast = useToast();
    const { data: session } = useSession();

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        countryCode: "+91",
        phone: ""
    });

    useEffect(() => {
        if (slug) {
            fetchWorkshop();
        }
    }, [slug]);

    const fetchWorkshop = async () => {
        try {
            const res = await fetch(`/api/workshops?slug=${slug}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setWorkshop(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch workshop", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (window.Razorpay) {
            setRazorpayLoaded(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => toast.error("Could not load the payment gateway. Please refresh and try again.");
        document.body.appendChild(script);
    }, [toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleQuantityChange = (delta: number) => {
        setSeats(prev => Math.max(1, Math.min(10, prev + delta)));
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workshop) return;

        if (!razorpayLoaded) {
            toast.error("Payment gateway is still loading. Please try again in a moment.");
            return;
        }

        setIsProcessing(true);

        const checkoutPath = `/workshops/${slug}/checkout`;
        const orderItems = [{
            id: workshop.id,
            kind: "workshop" as const,
            name: workshop.title,
            quantity: seats,
            price: workshop.price,
        }];

        try {
            // 1. Create the order. The amount is derived server-side from the
            // stored workshop price - what we send here is not trusted.
            const res = await fetch("/api/payment/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shippingAddress: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: `${formData.countryCode}${formData.phone}`,
                    },
                    items: orderItems,
                }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    toast.info("Sign in to continue", "Your seat selection is saved — we'll bring you straight back.");
                    router.push(`/login?callbackUrl=${encodeURIComponent(checkoutPath)}`);
                    setIsProcessing(false);
                    return;
                }
                const data = await res.json().catch(() => ({}));
                // Sold-out and seat-limit errors surface here - show the real
                // reason rather than a generic payment failure.
                throw new Error(data.error || "Failed to start the booking");
            }

            const orderData = await res.json();
            const dbOrderId = orderData.dbOrderId;

            // 2. Hand off to Razorpay
            const rzp = new window.Razorpay({
                key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "Core Creator",
                description: `${seats} seat(s) - ${workshop.title}`,
                order_id: orderData.order.id,
                handler: async function (response: RazorpayPaymentResponse) {
                    // 3. Verify the signature server-side. This is what marks
                    // the order paid and registers the attendee.
                    const verifyRes = await fetch("/api/payment/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: dbOrderId,
                            items: orderItems.map(i => ({ id: i.id, kind: "Workshop", quantity: i.quantity })),
                        }),
                    });

                    if (verifyRes.ok) {
                        router.push("/checkout/success");
                    } else {
                        // Money may have been taken - never tell them to just retry.
                        toast.error("Payment received but we could not confirm your booking. Please contact support with your payment ID.");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    contact: formData.phone,
                },
                modal: {
                    ondismiss: () => setIsProcessing(false),
                },
                theme: { color: "#9333EA" },
            });
            rzp.open();
        } catch (error) {
            console.error("Workshop payment failed:", error);
            toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-700)]" />
            </div>
        );
    }

    if (!workshop) {
        return (
            <div className="min-h-screen flex flex-col bg-[var(--background)]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold mb-4">Workshop not found</h1>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
                <Footer />
            </div>
        );
    }

    const subtotal = workshop.price * seats;
    // Was a hardcoded "18% GST example"; now the same configured rate as
    // everything else, so workshops and products cannot disagree.
    // A workshop is an electronically supplied service: 18%, not seller-chosen.
    const taxDetail = applyTax(subtotal, DIGITAL_SERVICE_GST_RATE);
    const tax = taxDetail.amount;
    const total = subtotal + tax;
    const workshopDate = new Date(workshop.date);

    return (
        <div className="min-h-screen bg-[var(--muted)]/30">
            <Header />

            <main className="container-app py-12 max-w-6xl">
                <Button
                    variant="link"
                    className="mb-8 pl-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workshop
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
                            <p className="text-[var(--muted-foreground)]">Complete your registration for {workshop.title}</p>
                        </div>

                        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 lg:p-8 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-[var(--primary-700)]" />
                                Participant Details
                            </h2>

                            <form id="checkout-form" onSubmit={handlePayment} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="First Name"
                                        name="firstName"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <Input
                                        label="Last Name"
                                        name="lastName"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number</label>
                                    <div className="flex gap-2">
                                        <select
                                            name="countryCode"
                                            className="px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] text-sm"
                                            value={formData.countryCode}
                                            onChange={handleInputChange}
                                        >
                                            <option value="+91">🇮🇳 +91</option>
                                            <option value="+1">🇺🇸 +1</option>
                                            <option value="+44">🇬🇧 +44</option>
                                            <option value="+61">🇦🇺 +61</option>
                                            <option value="+971">🇦🇪 +971</option>
                                            <option value="+65">🇸🇬 +65</option>
                                        </select>
                                        <input
                                            name="phone"
                                            type="tel"
                                            className="flex-1 px-4 py-2 rounded-lg border border-[var(--input)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                                            placeholder="98765 43210"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 lg:p-8 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-[var(--primary-700)]" />
                                Payment Method
                            </h2>
                            <div className="p-4 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)] flex items-center gap-4">
                                <div className="p-2 bg-white rounded shadow-sm">
                                    <img src="/images/razorpay-logo.png" alt="Razorpay" className="h-6 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <span className="text-sm font-bold text-blue-900">Razorpay</span>
                                </div>
                                <div>
                                    <p className="font-medium">Credit/Debit Card, UPI, NetBanking</p>
                                    <p className="text-sm text-[var(--muted-foreground)]">Secure payment gateway</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-lg">
                                <div className="h-32 relative">
                                    <ImageWithFallback
                                        src={workshop.thumbnail}
                                        alt={workshop.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4 text-white">
                                        <h3 className="font-bold truncate">{workshop.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(workshopDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{workshop.duration} mins</span>
                                        </div>
                                    </div>

                                    <div className="py-4 border-t border-b border-[var(--border)]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">Number of Seats</span>
                                            <div className="flex items-center gap-3 bg-[var(--muted)] rounded-lg p-1">
                                                <button
                                                    onClick={() => handleQuantityChange(-1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50"
                                                    disabled={seats <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="w-4 text-center font-bold">{seats}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50"
                                                    disabled={seats >= 10}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted-foreground)]">Price per seat</span>
                                            <span>{formatPrice(workshop.price)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted-foreground)]">Subtotal ({seats} seats)</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--muted-foreground)]">{taxDetail.label}</span>
                                            <span>{formatPrice(tax)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-[var(--border)]">
                                            <span>Total</span>
                                            <span>{formatPrice(total)}</span>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        form="checkout-form"
                                        className="w-full"
                                        size="lg"
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            `Pay ${formatPrice(total)}`
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50 p-2 rounded-lg">
                                        <Shield className="w-3 h-3" />
                                        <span>Secure 256-bit SSL Encrypted Payment</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
