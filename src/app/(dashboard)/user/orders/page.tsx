"use client";

import * as React from "react";
import { Loader2, Package, ExternalLink, AlertCircle } from "lucide-react";
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
                            <div className="bg-[var(--muted)]/50 p-4 flex flex-wrap gap-4 items-center justify-between text-sm border-b border-[var(--border)]">
                                <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8">
                                    <div>
                                        <p className="text-[var(--muted-foreground)] text-xs uppercase font-medium">{t("dashboard.orders.order_placed")}</p>
                                        <p className="font-medium">
                                            {new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[var(--muted-foreground)] text-xs uppercase font-medium">{t("common.total")}</p>
                                        <p className="font-medium">{formatPrice(order.total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[var(--muted-foreground)] text-xs uppercase font-medium">{t("dashboard.orders.order_number")}</p>
                                        <p className="font-medium">{order.orderNumber}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
