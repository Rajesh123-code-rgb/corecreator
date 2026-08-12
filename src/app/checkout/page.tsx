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
    ShieldCheck,
    Minus,
    Plus,
    Trash2
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { useTaxRate } from "@/hooks/useTaxRate";
import { applyTax } from "@/lib/tax";

const steps = ["Shipping", "Review & Pay"];

const CHECKOUT_DRAFT_KEY = "checkout-draft";

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { items, isHydrated, subtotal, clearCart, discount, promoCode, shippingTotal, updateQuantity, removeItem } = useCart();
    const { formatPrice } = useCurrency();
    const toast = useToast();
    const [currentStep, setCurrentStep] = React.useState(0);
    // Set once a signed-out shopper chooses "continue as guest", so the choice
    // screen doesn't reappear while they fill the form.
    const [guestMode, setGuestMode] = React.useState(false);
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

    // Checkout progress is kept in sessionStorage so a reload or an accidental
    // back-navigation doesn't wipe a half-filled shipping form. sessionStorage
    // (not localStorage) deliberately: this is PII, so it should not outlive the
    // tab, and it's cleared outright once payment succeeds.
    React.useEffect(() => {
        try {
            const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
            if (saved) {
                const draft = JSON.parse(saved);
                if (draft.address) setAddress((prev) => ({ ...prev, ...draft.address }));
                if (typeof draft.currentStep === "number") setCurrentStep(draft.currentStep);
            }
        } catch {
            sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        }
    }, []);

    React.useEffect(() => {
        try {
            sessionStorage.setItem(
                CHECKOUT_DRAFT_KEY,
                JSON.stringify({ address, currentStep })
            );
        } catch {
            // storage unavailable (private mode / quota) - persistence is a
            // convenience here, so failing to save must not break checkout.
        }
    }, [address, currentStep]);

    // Use shippingTotal from cart (calculated from product shipping prices)
    // Courses and workshops have 0 shipping
    const shipping = shippingTotal;
    const { rate: taxRate, displayName: taxName } = useTaxRate();
    const taxDetail = applyTax(subtotal, taxRate, taxName);
    const tax = taxDetail.amount;
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
        if (isHydrated && items.length === 0) {
            router.push("/cart");
        }
    }, [isHydrated, items, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddress({ ...address, [e.target.name]: e.target.value });
    };

    // Removing the last item at the review step would otherwise leave the
    // shopper on a checkout page with nothing to buy.
    const handleRemoveItem = (id: string, name: string) => {
        const wasLast = items.length === 1;
        removeItem(id);
        if (wasLast) {
            // An existing effect already routes an empty cart back to /cart;
            // this just explains why it happened.
            toast.info("Your cart is empty", "Add something to it to check out.");
            return;
        }
        toast.success("Removed from your order", `${name} is no longer in this order.`);
    };

    const handlePayment = async () => {
        if (!window.Razorpay) {
            toast.error("Payment gateway didn't load", "Check your connection and refresh the page to try again.");
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create Order
            const res = await fetch("/api/payment/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // Amount and currency are both derived server-side from the
                    // stored catalogue prices - anything sent here is ignored.
                    shippingAddress: address,
                    promoCode,
                    items: items.map(item => ({
                        id: item.id,
                        kind: item.type === "course" ? "course" : "product",
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        // Forwarded so the server can recompute the exact price
                        // from the stored catalogue rather than only checking it
                        // against the cheapest possible configuration.
                        variantId: item.variant?.id,
                        customizationIds: item.customizations?.map(c => c.id).filter(Boolean),
                        addOnIds: item.addOns?.map(a => a.id).filter(Boolean),
                    }))
                })
            });

            if (!res.ok) {
                // The order API requires a session. Middleware should have
                // redirected already, but a session can expire while the form
                // is open - say so plainly rather than blaming the payment.
                if (res.status === 401) {
                    toast.info("Sign in to continue", "Your cart is saved — we'll bring you straight back here.");
                    router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
                    setIsProcessing(false);
                    return;
                }
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to create order");
            }
            const orderData = await res.json();
            const dbOrderId = orderData.dbOrderId;
            const orderNumber = orderData.orderNumber as string | undefined;
            const guestAccountCreated = Boolean(orderData.guestAccountCreated);

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
                        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
                        const params = new URLSearchParams();
                        if (orderNumber) params.set("order", orderNumber);
                        if (guestAccountCreated) params.set("newAccount", "1");
                        router.push(`/checkout/success${params.toString() ? `?${params}` : ""}`);
                    } else {
                        toast.error("We couldn't confirm your payment", "If money left your account, contact support with your payment ID — don't pay again.");
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
            toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
            </div>
        );
    }
    if (items.length === 0) return null;

    // Signed-out shoppers pick how they want to check out before filling
    // anything in. Guest is a real option - create-order makes an account from
    // the email they enter and emails them a link to set a password - so this
    // is a genuine choice, not a login wall with extra steps.
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
            </div>
        );
    }

    if (status === "unauthenticated" && !guestMode) {
        const callback = encodeURIComponent("/checkout");
        return (
            <div className="min-h-screen bg-[var(--muted)] flex flex-col">
                <Header />
                <main id="main-content" className="py-12 flex-1">
                    <div className="container-app max-w-lg">
                        <div className="bg-white rounded-xl border border-[var(--border)] p-8">
                            <h1 className="text-2xl font-bold mb-2">How would you like to check out?</h1>
                            <p className="text-[var(--muted-foreground)] mb-8">
                                You can buy without an account — we&apos;ll set one up so you can track your order.
                            </p>

                            <div className="space-y-3">
                                <Button variant="secondary" size="lg" className="w-full" asChild>
                                    <Link href={`/login?callbackUrl=${callback}`}>Sign in to my account</Link>
                                </Button>
                                <Button variant="outline" size="lg" className="w-full" asChild>
                                    <Link href={`/register?callbackUrl=${callback}`}>Create an account</Link>
                                </Button>

                                <div className="flex items-center gap-3 py-2">
                                    <div className="h-px flex-1 bg-[var(--border)]" />
                                    <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">or</span>
                                    <div className="h-px flex-1 bg-[var(--border)]" />
                                </div>

                                <Button variant="outline" size="lg" className="w-full" onClick={() => setGuestMode(true)}>
                                    Continue as guest
                                </Button>
                                <p className="text-xs text-[var(--muted-foreground)] text-center">
                                    We&apos;ll create an account with the email you enter and send you a link to set a password.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
                                {currentStep === 0 && (
                                    <div className="space-y-6">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <MapPin className="w-5 h-5" /> Shipping Information
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        {/* Editable at this step. Previously the review
                                            list was read-only and the only way to change
                                            a basket was "Back to Cart", which meant
                                            re-entering the whole shipping form. */}
                                        <div className="divide-y divide-[var(--border)]">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex gap-3 sm:gap-4 py-4">
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm">{item.name}</p>
                                                        {item.type === "product" ? (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="flex items-center border border-[var(--border)] rounded-lg">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                        disabled={isProcessing || item.quantity <= 1}
                                                                        aria-label={`Reduce quantity of ${item.name}`}
                                                                        className="p-2 min-w-9 min-h-9 flex items-center justify-center hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg"
                                                                    >
                                                                        <Minus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <span className="w-9 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                        disabled={isProcessing}
                                                                        aria-label={`Increase quantity of ${item.name}`}
                                                                        className="p-2 min-w-9 min-h-9 flex items-center justify-center hover:bg-[var(--muted)] disabled:opacity-40 rounded-r-lg"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItem(item.id, item.name)}
                                                                    disabled={isProcessing}
                                                                    aria-label={`Remove ${item.name} from your order`}
                                                                    className="p-2 min-w-9 min-h-9 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-xs text-[var(--muted-foreground)]">Lifetime access</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItem(item.id, item.name)}
                                                                    disabled={isProcessing}
                                                                    aria-label={`Remove ${item.name} from your order`}
                                                                    className="p-2 min-w-9 min-h-9 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-medium whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
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
