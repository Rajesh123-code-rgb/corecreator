"use client";

import * as React from "react";
import { useToast } from "@/components/molecules";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/atoms";
import { Header, Footer } from "@/components/organisms";
import { useCart } from "@/context";
import { useSession } from "next-auth/react";
import {
    Lock,
    Check,
    ChevronLeft,
    MapPin,
    User,
    Mail,
    Phone,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

const steps = ["Shipping", "Review & Pay"];

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: any) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
}

interface Razorpay {
    new(options: RazorpayOptions): {
        open: () => void;
    };
}

declare global {
    interface Window {
        Razorpay: Razorpay;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { items, subtotal, clearCart, discount, promoCode, shippingTotal } = useCart();
    const { formatPrice } = useCurrency();
    const toast = useToast();
    const [currentStep, setCurrentStep] = React.useState(0);
    const [isProcessing, setIsProcessing] = React.useState(false);

    // Form State
    const [address, setAddress] = React.useState({
        firstName: session?.user?.name?.split(" ")[0] || "",
        lastName: session?.user?.name?.split(" ")[1] || "",
        email: session?.user?.email || "",
        phone: "",
        addressLine: "",
        city: "",
        zip: "",
        state: "",
        country: ""
    });

    // Use shippingTotal from cart (calculated from product shipping prices)
    // Courses and workshops have 0 shipping
    const shipping = shippingTotal;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax - discount;

    // Load Razorpay Script
    React.useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    React.useEffect(() => {
        if (items.length === 0) {
            router.push("/cart");
        }
    }, [items, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    const handlePayment = async () => {
        if (!window.Razorpay) {
            toast.error("Razorpay SDK failed to load. Are you online?");
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create Order
            const res = await fetch("/api/payment/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // Amount is calculated server-side now, but passing for reference if needed (will be ignored by backend logic)
                    amount: total,
                    currency: "USD",
                    shippingAddress: address,
                    promoCode,
                    items: items.map(item => ({
                        id: item.id,
                        kind: item.type === "course" ? "course" : "product",
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    }))
                })
            });

            if (!res.ok) throw new Error("Failed to create order");
            const orderData = await res.json();
            const dbOrderId = orderData.dbOrderId;

            // 2. Open Razorpay Modal
            const options: RazorpayOptions = {
                key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_123",
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "Core Creator",
                description: `Payment for ${items.length} items`,
                order_id: orderData.order.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    const verifyRes = await fetch("/api/payment/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: dbOrderId, // Send MongoDB Order ID for update
                            items: items.map(item => ({
                                id: item.id,
                                kind: item.type === "course" ? "Course" : "Product",
                                quantity: item.quantity
                            })),
                            shippingAddress: address
                        })
                    });

                    if (verifyRes.ok) {
                        clearCart();
                        router.push("/checkout/success");
                    } else {
                        toast.error("Payment verification failed");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: `${address.firstName} ${address.lastName}`,
                    email: address.email,
                    contact: address.phone
                },
                theme: {
                    color: "#9333EA" // Purple-600
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Payment failed:", error);
            toast.error("Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="min-h-screen bg-[var(--muted)] flex flex-col">
            <Header />

            {/* Secure Checkout Bar */}
            <div className="bg-white border-b border-[var(--border)]">
                <div className="container-app py-3 flex items-center justify-between">
                    <Link href="/cart" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Cart
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                        <Lock className="w-4 h-4" />
                        <span>Secure Checkout</span>
                    </div>
                </div>
            </div>

            <main className="py-8 flex-1">
                <div className="container-app max-w-6xl">
                    <div className="flex items-center justify-center mb-8">
                        {steps.map((step, index) => (
                            <React.Fragment key={step}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStep
                                        ? "bg-green-500 text-white"
                                        : index === currentStep
                                            ? "bg-[var(--secondary-500)] text-white"
                                            : "bg-[var(--border)] text-[var(--muted-foreground)]"
                                        }`}>
                                        {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                                    </div>
                                    <span className={`text-sm ${index === currentStep ? "font-medium" : "text-[var(--muted-foreground)]"}`}>
                                        {step}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-16 h-0.5 mx-4 ${index < currentStep ? "bg-green-500" : "bg-[var(--border)]"}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
                                {currentStep === 0 && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <MapPin className="w-5 h-5" /> Shipping Information
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <Input label="First Name" name="firstName" placeholder="John" value={address.firstName} onChange={handleInputChange} leftIcon={<User className="w-5 h-5" />} />
                                            <Input label="Last Name" name="lastName" placeholder="Doe" value={address.lastName} onChange={handleInputChange} />
                                            <Input label="Email" name="email" type="email" placeholder="john@example.com" value={address.email} onChange={handleInputChange} leftIcon={<Mail className="w-5 h-5" />} className="md:col-span-2" />
                                            <Input label="Phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" value={address.phone} onChange={handleInputChange} leftIcon={<Phone className="w-5 h-5" />} className="md:col-span-2" />
                                            <Input label="Address" name="addressLine" placeholder="123 Main St" value={address.addressLine} onChange={handleInputChange} className="md:col-span-2" />
                                            <Input label="City" name="city" placeholder="New York" value={address.city} onChange={handleInputChange} />
                                            <Input label="ZIP Code" name="zip" placeholder="10001" value={address.zip} onChange={handleInputChange} />
                                            <Input label="State" name="state" placeholder="NY" value={address.state} onChange={handleInputChange} />
                                            <Input label="Country" name="country" placeholder="United States" value={address.country} onChange={handleInputChange} />
                                        </div>
                                        <Button variant="secondary" size="lg" className="w-full" onClick={() => setCurrentStep(1)}>
                                            Continue to Review
                                        </Button>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-semibold">Review Order</h2>
                                        <div className="divide-y divide-[var(--border)]">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex gap-4 py-4">
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{item.name}</p>
                                                        <p className="text-xs text-[var(--muted-foreground)]">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-[var(--secondary-50)] p-4 rounded-lg flex items-start gap-3">
                                            <ShieldCheck className="w-5 h-5 text-[var(--secondary-600)] flex-shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-[var(--secondary-800)]">Secure Payment via Razorpay</p>
                                                <p className="text-[var(--secondary-600)]">Your payment is encrypted and secured. You will be redirected to the secure payment gateway.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button variant="outline" size="lg" onClick={() => setCurrentStep(0)} disabled={isProcessing}>Back</Button>
                                            <Button variant="secondary" size="lg" className="flex-1" onClick={handlePayment} isLoading={isProcessing}>
                                                {isProcessing ? "Processing..." : `Pay ${formatPrice(total)}`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8 bg-white rounded-xl border border-[var(--border)] p-6">
                                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
                                <div className="space-y-2 text-sm border-t border-[var(--border)] pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">Shipping</span>
                                        <span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">Tax</span>
                                        <span>{formatPrice(tax)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span>Discount {promoCode && `(${promoCode})`}</span>
                                            <span>-{formatPrice(discount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-[var(--border)]">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
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
