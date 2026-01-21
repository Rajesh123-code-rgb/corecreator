"use client";

import * as React from "react";
import {
    Loader2,
    Package,
    Search,
    Filter,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    ChevronDown,
    ExternalLink,
} from "lucide-react";
import { Button, Input } from "@/components/atoms";
import { Card, CardContent } from "@/components/molecules";
import { useCurrency } from "@/context/CurrencyContext";

interface OrderItem {
    itemType: "product" | "course" | "workshop";
    itemId: string;
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
    paymentStatus: string;
    items: OrderItem[];
    user: {
        _id: string;
        name: string;
        email: string;
    };
    shippingAddress?: {
        fullName: string;
        city: string;
        state: string;
        country: string;
    };
    shippingTracking?: {
        carrier: string;
        trackingNumber: string;
        trackingUrl?: string;
    };
}

const STATUS_OPTIONS = [
    { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-700" },
    { value: "processing", label: "Processing", color: "bg-amber-100 text-amber-700" },
    { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-700" },
    { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-700" },
];

const FILTER_TABS = [
    { value: "all", label: "All Orders" },
    { value: "confirmed", label: "New" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
];

export default function StudioOrdersPage() {
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState("all");
    const [search, setSearch] = React.useState("");
    const [updating, setUpdating] = React.useState<string | null>(null);

    // Tracking modal state
    const [showTrackingModal, setShowTrackingModal] = React.useState(false);
    const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
    const [trackingForm, setTrackingForm] = React.useState({
        carrier: "",
        trackingNumber: "",
        trackingUrl: "",
    });

    const fetchOrders = React.useCallback(async () => {
        try {
            const url = filter === "all"
                ? "/api/studio/orders"
                : `/api/studio/orders?status=${filter}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    React.useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/studio/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setOrders(prev => prev.map(o =>
                    o._id === orderId ? { ...o, status: newStatus } : o
                ));
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setUpdating(null);
        }
    };

    const handleAddTracking = async () => {
        if (!selectedOrder || !trackingForm.carrier || !trackingForm.trackingNumber) return;

        setUpdating(selectedOrder._id);
        try {
            const res = await fetch(`/api/studio/orders/${selectedOrder._id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "shipped",
                    tracking: trackingForm,
                }),
            });

            if (res.ok) {
                setOrders(prev => prev.map(o =>
                    o._id === selectedOrder._id
                        ? { ...o, status: "shipped", shippingTracking: trackingForm }
                        : o
                ));
                setShowTrackingModal(false);
                setTrackingForm({ carrier: "", trackingNumber: "", trackingUrl: "" });
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error("Failed to add tracking:", error);
        } finally {
            setUpdating(null);
        }
    };

    const openTrackingModal = (order: Order) => {
        setSelectedOrder(order);
        setTrackingForm({
            carrier: order.shippingTracking?.carrier || "",
            trackingNumber: order.shippingTracking?.trackingNumber || "",
            trackingUrl: order.shippingTracking?.trackingUrl || "",
        });
        setShowTrackingModal(true);
    };

    const getStatusBadge = (status: string) => {
        const option = STATUS_OPTIONS.find(s => s.value === status);
        if (status === "pending") return "bg-gray-100 text-gray-700";
        if (status === "cancelled") return "bg-red-100 text-red-700";
        return option?.color || "bg-gray-100 text-gray-700";
    };

    const filteredOrders = orders.filter(order => {
        if (!search) return true;
        const query = search.toLowerCase();
        return (
            order.orderNumber.toLowerCase().includes(query) ||
            order.user?.name?.toLowerCase().includes(query) ||
            order.user?.email?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500">Manage orders for your products</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-medium">
                    <Package className="w-4 h-4" />
                    {orders.filter(o => o.status === "confirmed").length} New Orders
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-200">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${filter === tab.value
                                ? "border-amber-500 text-amber-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by order number or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium">No orders found</h3>
                        <p className="text-gray-500">Orders for your products will appear here</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <Card key={order._id} className="overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Order</p>
                                        <p className="font-semibold">{order.orderNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Customer</p>
                                        <p className="font-medium">{order.user?.name || "Guest"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Date</p>
                                        <p className="font-medium">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
                                        <p className="font-semibold">{formatPrice(order.total)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </span>

                                    {/* Status Dropdown */}
                                    {order.status !== "delivered" && order.status !== "cancelled" && (
                                        <div className="relative">
                                            <select
                                                value={order.status}
                                                onChange={(e) => {
                                                    if (e.target.value === "shipped" && !order.shippingTracking) {
                                                        openTrackingModal(order);
                                                    } else {
                                                        handleStatusChange(order._id, e.target.value);
                                                    }
                                                }}
                                                disabled={updating === order._id}
                                                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <CardContent className="p-4">
                                {/* Order Items */}
                                <div className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Shipping & Tracking */}
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        {order.shippingAddress && (
                                            <span>Ship to: {order.shippingAddress.city}, {order.shippingAddress.state}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {order.shippingTracking ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Truck className="w-4 h-4 text-purple-500" />
                                                <span>{order.shippingTracking.carrier}: {order.shippingTracking.trackingNumber}</span>
                                                {order.shippingTracking.trackingUrl && (
                                                    <a href={order.shippingTracking.trackingUrl} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                                    </a>
                                                )}
                                            </div>
                                        ) : order.status === "processing" ? (
                                            <Button variant="outline" size="sm" onClick={() => openTrackingModal(order)}>
                                                <Truck className="w-4 h-4 mr-1" /> Add Tracking
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Tracking Modal */}
            {showTrackingModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5" /> Add Shipping Tracking
                        </h2>
                        <p className="text-gray-500 mb-6">Order {selectedOrder.orderNumber}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                                <select
                                    value={trackingForm.carrier}
                                    onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">Select carrier...</option>
                                    <option value="BlueDart">BlueDart</option>
                                    <option value="Delhivery">Delhivery</option>
                                    <option value="DTDC">DTDC</option>
                                    <option value="FedEx">FedEx</option>
                                    <option value="DHL">DHL</option>
                                    <option value="India Post">India Post</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                                <Input
                                    value={trackingForm.trackingNumber}
                                    onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                                    placeholder="Enter tracking number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking URL (Optional)</label>
                                <Input
                                    value={trackingForm.trackingUrl}
                                    onChange={(e) => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Direct link to track the shipment</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowTrackingModal(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-amber-500 hover:bg-amber-600"
                                onClick={handleAddTracking}
                                disabled={!trackingForm.carrier || !trackingForm.trackingNumber || updating === selectedOrder._id}
                            >
                                {updating === selectedOrder._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Mark as Shipped"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
