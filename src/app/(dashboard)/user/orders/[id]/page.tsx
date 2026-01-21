"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    Package,
    CheckCircle,
    Clock,
    Truck,
    MapPin,
    ChevronLeft,
    ExternalLink,
    Copy,
    Check,
} from "lucide-react";
import { Button } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { useCurrency } from "@/context/CurrencyContext";

interface TrackingEvent {
    status: string;
    timestamp: string;
    message: string;
}

interface OrderItem {
    itemType: "product" | "course" | "workshop";
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

interface Order {
    _id: string;
    orderNumber: string;
    createdAt: string;
    total: number;
    subtotal: number;
    tax: number;
    discount: number;
    status: string;
    paymentStatus: string;
    items: OrderItem[];
    shippingAddress?: {
        fullName: string;
        phone: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    shippingTracking?: {
        carrier: string;
        trackingNumber: string;
        trackingUrl?: string;
        estimatedDelivery?: string;
    };
    trackingHistory: TrackingEvent[];
}

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_LABELS: Record<string, string> = {
    pending: "Order Placed",
    confirmed: "Order Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
};

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;
    const { formatPrice } = useCurrency();

    const [order, setOrder] = React.useState<Order | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/user/orders/${orderId}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data.order);
                }
            } catch (error) {
                console.error("Failed to fetch order:", error);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrder();
    }, [orderId]);

    const copyTrackingNumber = async () => {
        if (order?.shippingTracking?.trackingNumber) {
            await navigator.clipboard.writeText(order.shippingTracking.trackingNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getCurrentStepIndex = () => {
        if (!order) return 0;
        if (order.status === "cancelled" || order.status === "refunded") return -1;
        return STATUS_STEPS.indexOf(order.status);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold">Order not found</h2>
                <Link href="/user/orders">
                    <Button variant="outline" className="mt-4">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Orders
                    </Button>
                </Link>
            </div>
        );
    }

    const currentStep = getCurrentStepIndex();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/user/orders" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" /> Back to Orders
                    </Link>
                    <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
                    <p className="text-gray-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                </div>
                <div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${order.status === "delivered" ? "bg-green-100 text-green-700" :
                            order.status === "cancelled" || order.status === "refunded" ? "bg-red-100 text-red-700" :
                                order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                                    "bg-amber-100 text-amber-700"
                        }`}>
                        {STATUS_LABELS[order.status] || order.status}
                    </span>
                </div>
            </div>

            {/* Tracking Timeline */}
            {order.status !== "cancelled" && order.status !== "refunded" && (
                <Card>
                    <CardContent className="p-6">
                        <h2 className="font-semibold text-lg mb-6">Order Progress</h2>

                        {/* Progress Bar */}
                        <div className="relative mb-8">
                            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                            <div
                                className="absolute top-5 left-0 h-1 bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(0, currentStep) * 25}%` }}
                            />

                            <div className="relative flex justify-between">
                                {STATUS_STEPS.map((step, idx) => {
                                    const isCompleted = idx <= currentStep;
                                    const isCurrent = idx === currentStep;

                                    return (
                                        <div key={step} className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white z-10 ${isCompleted ? "border-green-500 bg-green-500 text-white" :
                                                    isCurrent ? "border-green-500 text-green-500" :
                                                        "border-gray-300 text-gray-400"
                                                }`}>
                                                {isCompleted ? (
                                                    <CheckCircle className="w-5 h-5" />
                                                ) : step === "pending" ? (
                                                    <Clock className="w-5 h-5" />
                                                ) : step === "shipped" ? (
                                                    <Truck className="w-5 h-5" />
                                                ) : step === "delivered" ? (
                                                    <MapPin className="w-5 h-5" />
                                                ) : (
                                                    <Package className="w-5 h-5" />
                                                )}
                                            </div>
                                            <span className={`text-xs mt-2 font-medium ${isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                                                }`}>
                                                {STATUS_LABELS[step]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Shipping Tracking */}
                        {order.shippingTracking && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-blue-900">
                                                {order.shippingTracking.carrier}
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Tracking: {order.shippingTracking.trackingNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={copyTrackingNumber}
                                            className="border-blue-200"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                        {order.shippingTracking.trackingUrl && (
                                            <a
                                                href={order.shippingTracking.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button variant="secondary" size="sm">
                                                    Track <ExternalLink className="w-4 h-4 ml-1" />
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {order.shippingTracking.estimatedDelivery && (
                                    <p className="text-sm text-blue-600 mt-2">
                                        Expected delivery: {new Date(order.shippingTracking.estimatedDelivery).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Tracking History */}
                        {order.trackingHistory && order.trackingHistory.length > 0 && (
                            <div>
                                <h3 className="font-medium text-gray-900 mb-4">Tracking History</h3>
                                <div className="space-y-4">
                                    {order.trackingHistory.slice().reverse().map((event, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-green-500" : "bg-gray-300"
                                                    }`} />
                                                {idx < order.trackingHistory.length - 1 && (
                                                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="font-medium text-gray-900">{event.message}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Order Items */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="font-semibold text-lg mb-4">Order Items</h2>
                    <div className="divide-y divide-gray-100">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-medium">{item.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{item.itemType}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatPrice(item.price)}</p>
                                    {item.quantity > 1 && (
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>-{formatPrice(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tax</span>
                            <span>{formatPrice(order.tax)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
                <Card>
                    <CardContent className="p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Shipping Address
                        </h2>
                        <div className="text-gray-700">
                            <p className="font-medium">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                            <p className="mt-2 text-gray-500">Phone: {order.shippingAddress.phone}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
