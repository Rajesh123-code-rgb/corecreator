"use client";

import * as React from "react";
import { formatDate } from "@/lib/formatDate";
import { InvoiceDownloadButton } from "@/components/molecules/InvoiceDownloadButton";
import { Loader2, Package, ExternalLink, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

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
    status: string;
    items: OrderItem[];
    paymentStatus: string;
    // Present on the document and returned by the API - the invoice needs them.
    subtotal?: number;
    tax?: number;
    shipping?: number;
    discount?: number;
    paymentMethod?: string;
    shippingAddress?: {
        fullName?: string; addressLine1?: string; city?: string;
        state?: string; postalCode?: string; country?: string; phone?: string;
    };
}

export default function OrdersPage() {
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch("/api/user/orders");
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-600)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t("dashboard.orders.title")}</h1>

            {orders.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Package className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
                        <h3 className="text-lg font-medium mb-1">{t("dashboard.no_orders")}</h3>
                        <p className="text-[var(--muted-foreground)] mb-4">
                            {t("dashboard.orders.empty")}
                        </p>
                        <div className="flex justify-center">
                            <Button className="mt-2" asChild>
                                <Link href="/marketplace">
                                    {t("dashboard.orders.browse_products")}
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order._id} className="overflow-hidden">
                            <div className="bg-[var(--muted)]/50 p-4 border-b border-[var(--border)]">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="grid grid-cols-2 sm:flex gap-x-6 gap-y-3 text-sm">
                                        <div>
                                            <p className="text-[var(--muted-foreground)] text-xs uppercase font-medium">{t("dashboard.orders.order_placed")}</p>
                                            <p className="font-medium">{formatDate(order.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[var(--muted-foreground)] text-xs uppercase font-medium">{t("common.total")}</p>
                                            <p className="font-medium tabular-nums">{formatPrice(order.total)}</p>
                                        </div>
                                        <div className="col-span-2 sm:col-auto">
                                            <p className="text-[var(--muted-foreground)] text-xs uppercase font-medium">{t("dashboard.orders.order_number")}</p>
                                            <p className="font-medium font-mono text-xs sm:text-sm">{order.orderNumber}</p>
                                        </div>
                                    </div>

                                    {/* Payment state matters more to a buyer than the
                                        fulfilment stage, so show both rather than
                                        conflating them under one badge. */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {order.paymentStatus === "paid" && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                                        )}
                                        {order.paymentStatus === "pending" && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Payment pending</span>
                                        )}
                                        {order.paymentStatus === "failed" && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Payment failed</span>
                                        )}
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <ul className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-4">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover border border-[var(--border)]" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-md bg-[var(--muted)] flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-[var(--muted-foreground)]" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium line-clamp-1">{item.name}</h4>
                                                <p className="text-sm text-[var(--muted-foreground)] capitalize">{item.itemType}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatPrice(item.price)}</p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs text-[var(--muted-foreground)]">{t("dashboard.orders.quantity")}: {item.quantity}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* The detail page - tracking history, address,
                                    tax breakdown - was already built but nothing
                                    ever linked to it. */}
                                <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/user/orders/${order._id}`}>
                                            View order details
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </Button>
                                    {order.paymentStatus === "paid" && (
                                        <InvoiceDownloadButton
                                            order={{
                                                orderNumber: order.orderNumber,
                                                createdAt: order.createdAt,
                                                items: order.items,
                                                subtotal: order.subtotal,
                                                tax: order.tax,
                                                shipping: order.shipping,
                                                discount: order.discount,
                                                total: order.total,
                                                paymentMethod: order.paymentMethod,
                                                shippingAddress: order.shippingAddress,
                                            }}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
