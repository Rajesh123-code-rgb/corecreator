import Link from "next/link";
import { Button } from "@/components/atoms";
import { CheckCircle2, Package, Mail, ArrowRight } from "lucide-react";

export default function CheckoutSuccessPage() {
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

    return (
        <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center p-8">
            <div className="max-w-lg w-full text-center">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        Thank you for your purchase. Your order has been successfully placed.
                    </p>

                    <div className="bg-[var(--muted)] rounded-xl p-4 mb-6">
                        <p className="text-sm text-[var(--muted-foreground)]">Order ID</p>
                        <p className="font-mono font-bold text-lg">{orderId}</p>
                    </div>

                    <div className="space-y-4 text-left mb-8">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Confirmation Email Sent</p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    Check your inbox for order details and receipt
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                            <Package className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Shipping Update</p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    You'll receive tracking info once your order ships
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="secondary" size="lg" className="flex-1" asChild>
                            <Link href="/user/dashboard">
                                My Dashboard
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="flex-1" asChild>
                            <Link href="/marketplace">Continue Shopping</Link>
                        </Button>
                    </div>
                </div>

                <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                    Need help? <Link href="/help" className="text-[var(--secondary-600)] hover:underline">Contact Support</Link>
                </p>
            </div>
        </div>
    );
}
