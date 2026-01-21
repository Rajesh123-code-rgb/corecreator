"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header, Footer } from "@/components/organisms";
import { Button, Input, ImageWithFallback } from "@/components/atoms";
import { useCurrency } from "@/context/CurrencyContext";
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleQuantityChange = (delta: number) => {
        setSeats(prev => Math.max(1, Math.min(10, prev + delta)));
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate Payment Processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        alert(`Payment Successful! Registered ${seats} seat(s) for ${workshop?.title}.`);
        setIsProcessing(false);
        router.push("/checkout/success"); // Or a dedicated success page
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
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
    const tax = subtotal * 0.18; // 18% GST example
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

                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
                            <p className="text-[var(--muted-foreground)]">Complete your registration for {workshop.title}</p>
                        </div>

                        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 lg:p-8 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-[var(--primary-600)]" />
                                Participant Details
                            </h2>

                            <form id="checkout-form" onSubmit={handlePayment} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
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
                                <CreditCard className="w-5 h-5 text-[var(--primary-600)]" />
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
                                            <span suppressHydrationWarning>{workshopDate.toLocaleDateString()}</span>
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
                                            <span className="text-[var(--muted-foreground)]">Taxes (18%)</span>
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
