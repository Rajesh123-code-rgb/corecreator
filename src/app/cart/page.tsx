"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header, Footer } from "@/components/organisms";
import { Button } from "@/components/atoms";
import { useCart } from "@/context";
import { useCurrency } from "@/context/CurrencyContext";
import {
    Trash2,
    Minus,
    Plus,
    ShoppingBag,
    ArrowRight,
    Tag,
    Truck,
    Shield,
} from "lucide-react";

export default function CartPage() {
    const { items, removeItem, updateQuantity, subtotal, clearCart, applyPromo, removePromo, discount, promoCode } = useCart();
    const { formatPrice } = useCurrency();
    const [inputCode, setInputCode] = React.useState("");
    const [error, setError] = React.useState("");

    const shipping = subtotal > 100 ? 0 : 15;
    const tax = subtotal * 0.08;
    const total = subtotal - discount;

    const handleApplyPromo = async () => {
        if (!inputCode) return;
        setError("");

        try {
            const res = await fetch("/api/promo-codes/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: inputCode, cartTotal: subtotal, items })
            });
            const data = await res.json();

            if (res.ok) {
                applyPromo(data.code, data.discountAmount);
            } else {
                setError(data.error || "Invalid code");
            }
        } catch (err) {
            setError("Failed to validate code");
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <Header />
                <main className="pt-24 pb-16">
                    <div className="container-app max-w-4xl text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--muted)] flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-[var(--muted-foreground)]" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
                        <p className="text-[var(--muted-foreground)] mb-8">
                            Discover amazing artworks and courses from talented creators
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button variant="secondary" size="lg" asChild>
                                <Link href="/marketplace">Browse Artworks</Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/learn">Explore Courses</Link>
                            </Button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <main className="pt-24 pb-16">
                <div className="container-app">
                    <h1 className="text-2xl lg:text-3xl font-bold mb-8">Shopping Cart</h1>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-4 bg-white rounded-xl border border-[var(--border)]"
                                >
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium line-clamp-2">{item.name}</p>
                                                <p className="text-sm text-[var(--muted-foreground)]">
                                                    {item.type === "course" ? `by ${item.instructor}` : `by ${item.seller}`}
                                                </p>
                                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${item.type === "course"
                                                    ? "bg-purple-100 text-purple-700"
                                                    : "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {item.type === "course" ? "Course" : "Artwork"}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            {item.type === "product" ? (
                                                <div className="flex items-center border border-[var(--border)] rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-2 hover:bg-[var(--muted)]"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-2 hover:bg-[var(--muted)]"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-[var(--muted-foreground)]">Lifetime Access</span>
                                            )}
                                            <p className="font-bold text-lg">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={clearCart}
                                className="text-sm text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                            >
                                Clear Cart
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 bg-white rounded-xl border border-[var(--border)] p-6">
                                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

                                {/* Promo Code */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Promo code"
                                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)]"
                                            value={inputCode}
                                            onChange={(e) => setInputCode(e.target.value)}
                                            disabled={!!promoCode}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleApplyPromo}
                                            disabled={!!promoCode || !inputCode}
                                        >
                                            {promoCode ? "Applied" : "Apply"}
                                        </Button>
                                    </div>
                                    {promoCode && (
                                        <div className="flex items-center justify-between text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                            <span className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {promoCode}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    removePromo();
                                                    setInputCode("");
                                                }}
                                                className="hover:text-green-800"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    {error && <p className="text-xs text-red-500">{error}</p>}
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">Shipping</span>
                                        <span className={shipping === 0 ? "text-green-600" : ""}>
                                            {shipping === 0 ? "Free" : formatPrice(shipping)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--muted-foreground)]">Tax (8%)</span>
                                        <span>{formatPrice(tax)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span>Discount</span>
                                            <span>-{formatPrice(discount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-[var(--border)] pt-3 flex justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span>{formatPrice(total + shipping + tax)}</span>
                                    </div>
                                </div>

                                <Button variant="secondary" size="lg" className="w-full mt-6" asChild>
                                    <Link href="/checkout">
                                        Proceed to Checkout
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Link>
                                </Button>

                                <div className="mt-6 space-y-3 text-xs text-[var(--muted-foreground)]">
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4" />
                                        <span>Free shipping on orders over {formatPrice(100)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        <span>Secure checkout with 256-bit encryption</span>
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
