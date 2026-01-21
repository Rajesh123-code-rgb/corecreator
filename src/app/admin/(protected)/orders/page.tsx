"use client";

import * as React from "react";
import {
    Search,
    Loader2,
    Eye,
    Package,
    DollarSign,
    Clock,
    XCircle,
    RefreshCw,
    Truck,
    X,
    MapPin,
    User,
    CreditCard,
    Store,
    Calendar,
    ExternalLink,
    Copy,
    Check,
} from "lucide-react";
import { Button } from "@/components/atoms";

interface OrderItem {
    itemType: "product" | "course" | "workshop";
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    sellerId?: string;
    sellerName?: string;
    seller?: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
}

interface OrderDetail {
    _id: string;
    orderNumber: string;
    user: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        avatar?: string;
        createdAt?: string;
    } | null;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    promoCode?: string;
    promoDiscount?: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentDetails?: {
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        method?: string;
        paidAt?: string;
    };
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
    trackingHistory?: {
        status: string;
        timestamp: string;
        message: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

interface Order {
    _id: string;
    orderNumber: string;
    user: {
        name: string;
        email: string;
    } | null;
    total: number;
    status: string;
    paymentStatus: string;
    shippingTracking?: {
        carrier: string;
        trackingNumber: string;
    };
    createdAt: string;
    items: any[];
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [stats, setStats] = React.useState({ total: 0, revenue: 0, pending: 0, refunded: 0 });

    // Order Detail Modal State
    const [selectedOrder, setSelectedOrder] = React.useState<OrderDetail | null>(null);
    const [detailLoading, setDetailLoading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const fetchOrders = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                status: statusFilter,
            });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/orders?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
                setTotalPages(data.pagination.pages);

                const revenue = data.orders.filter((o: Order) => o.paymentStatus === "paid").reduce((sum: number, o: Order) => sum + o.total, 0);
                const pending = data.orders.filter((o: Order) => o.paymentStatus === "pending").length;
                const refunded = data.orders.filter((o: Order) => o.paymentStatus === "refunded").length;
                setStats({ total: data.pagination.total, revenue, pending, refunded });
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    React.useEffect(() => {
        const timer = setTimeout(() => { fetchOrders(); }, 300);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    const viewOrderDetails = async (orderId: string) => {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedOrder(data.order);
            }
        } catch (error) {
            console.error("Failed to fetch order details:", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getPaymentBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: "bg-green-100 text-green-700",
            pending: "bg-yellow-100 text-yellow-700",
            failed: "bg-red-100 text-red-700",
            refunded: "bg-gray-100 text-gray-700"
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getOrderStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-gray-100 text-gray-700",
            confirmed: "bg-blue-100 text-blue-700",
            processing: "bg-amber-100 text-amber-700",
            shipped: "bg-purple-100 text-purple-700",
            delivered: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
        };
        return styles[status] || "bg-gray-100 text-gray-700";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-500 mt-1">Track and view customer orders</p>
                </div>
                <Button variant="outline" onClick={fetchOrders}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-sm text-gray-500">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">₹{stats.revenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Revenue</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            <p className="text-sm text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.refunded}</p>
                            <p className="text-sm text-gray-500">Refunded</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search by Order ID..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { id: "all", label: "All" },
                                { id: "paid", label: "Paid" },
                                { id: "pending", label: "Pending" },
                                { id: "refunded", label: "Refunded" }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStatusFilter(s.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s.id
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-purple-600">{order.orderNumber}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{order.user?.name || "Unknown"}</p>
                                                <p className="text-xs text-gray-500">{order.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} items</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">₹{order.total.toFixed(2)}</td>
                                        <td className="px-6 py-4">{getPaymentBadge(order.paymentStatus)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getOrderStatusBadge(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                {order.shippingTracking && (
                                                    <span className="text-xs text-purple-600" title={`${order.shippingTracking.carrier}: ${order.shippingTracking.trackingNumber}`}>
                                                        <Truck className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => viewOrderDetails(order._id)}
                                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="View Order Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {(selectedOrder || detailLoading) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        {detailLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                            </div>
                        ) : selectedOrder && (
                            <>
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Order {selectedOrder.orderNumber}</h2>
                                        <p className="text-sm text-gray-500">
                                            Placed on {new Date(selectedOrder.createdAt).toLocaleDateString("en-US", {
                                                weekday: "long", year: "numeric", month: "long", day: "numeric"
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
                                    {/* Status Row */}
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">Order Status:</span>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getOrderStatusBadge(selectedOrder.status)}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">Payment:</span>
                                            {getPaymentBadge(selectedOrder.paymentStatus)}
                                        </div>
                                    </div>

                                    {/* Customer Details */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                            <User className="w-4 h-4" /> Customer Details
                                        </h3>
                                        {selectedOrder.user ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Name</p>
                                                    <p className="font-medium">{selectedOrder.user.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Email</p>
                                                    <p className="font-medium">{selectedOrder.user.email}</p>
                                                </div>
                                                {selectedOrder.user.phone && (
                                                    <div>
                                                        <p className="text-sm text-gray-500">Phone</p>
                                                        <p className="font-medium">{selectedOrder.user.phone}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.user.createdAt && (
                                                    <div>
                                                        <p className="text-sm text-gray-500">Customer Since</p>
                                                        <p className="font-medium">{new Date(selectedOrder.user.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Guest checkout</p>
                                        )}
                                    </div>

                                    {/* Order Items */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                            <Package className="w-4 h-4" /> Order Items
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-4 bg-white p-3 rounded-lg">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            <Package className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{item.name}</p>
                                                        <p className="text-sm text-gray-500 capitalize">{item.itemType} • Qty: {item.quantity}</p>
                                                        {item.seller && (
                                                            <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                                                <Store className="w-3 h-3" />
                                                                Seller: {item.seller.name} ({item.seller.email})
                                                            </p>
                                                        )}
                                                        {item.sellerName && !item.seller && (
                                                            <p className="text-xs text-gray-500 mt-1">Seller: {item.sellerName}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                        <p className="text-xs text-gray-500">₹{item.price} each</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Studio/Seller Details */}
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
                                            <Store className="w-4 h-4" /> Studio/Seller Details
                                        </h3>
                                        {(() => {
                                            // Get unique sellers from items
                                            const sellersMap = new Map();
                                            selectedOrder.items.forEach((item) => {
                                                const sellerId = item.sellerId || item.seller?._id;
                                                if (sellerId && !sellersMap.has(sellerId)) {
                                                    sellersMap.set(sellerId, {
                                                        id: sellerId,
                                                        name: item.seller?.name || item.sellerName || "Unknown Seller",
                                                        email: item.seller?.email || "",
                                                        avatar: item.seller?.avatar,
                                                        items: []
                                                    });
                                                }
                                                if (sellerId) {
                                                    sellersMap.get(sellerId).items.push(item.name);
                                                }
                                            });

                                            const sellers = Array.from(sellersMap.values());

                                            if (sellers.length === 0) {
                                                return (
                                                    <p className="text-amber-700 text-sm">
                                                        Seller information not available for this order. This may be an older order created before seller tracking was enabled.
                                                    </p>
                                                );
                                            }

                                            return (
                                                <div className="space-y-3">
                                                    {sellers.map((seller: any, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                                            {seller.avatar ? (
                                                                <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                                    <Store className="w-5 h-5 text-amber-600" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">{seller.name}</p>
                                                                {seller.email && (
                                                                    <p className="text-sm text-gray-500">{seller.email}</p>
                                                                )}
                                                                <p className="text-xs text-amber-600 mt-1">
                                                                    Products: {seller.items.join(", ")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Shipping Details - Always show */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                            <MapPin className="w-4 h-4" /> Shipping Details
                                        </h3>
                                        {selectedOrder.shippingAddress ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Recipient</p>
                                                    <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                                                    <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Address</p>
                                                    <p className="font-medium">{selectedOrder.shippingAddress.addressLine1}</p>
                                                    {selectedOrder.shippingAddress.addressLine2 && (
                                                        <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.addressLine2}</p>
                                                    )}
                                                    <p className="text-sm text-gray-600">
                                                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.country}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm">
                                                <p>No shipping address available.</p>
                                                <p className="text-xs mt-1">This may be a digital product order or the address was not captured during checkout.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                            <CreditCard className="w-4 h-4" /> Payment Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Payment Method</p>
                                                <p className="font-medium capitalize">{selectedOrder.paymentMethod || "N/A"}</p>
                                            </div>
                                            {selectedOrder.paymentDetails?.razorpayPaymentId && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Payment ID</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium font-mono text-sm">{selectedOrder.paymentDetails.razorpayPaymentId}</p>
                                                        <button
                                                            onClick={() => copyToClipboard(selectedOrder.paymentDetails?.razorpayPaymentId || "")}
                                                            className="p-1 hover:bg-white rounded"
                                                        >
                                                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedOrder.paymentDetails?.paidAt && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Paid At</p>
                                                    <p className="font-medium">{new Date(selectedOrder.paymentDetails.paidAt).toLocaleString()}</p>
                                                </div>
                                            )}
                                            {selectedOrder.promoCode && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Promo Code</p>
                                                    <p className="font-medium">{selectedOrder.promoCode} (-₹{selectedOrder.promoDiscount})</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* Order Summary */}
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span>₹{selectedOrder.subtotal?.toFixed(2) || "0.00"}</span>
                                            </div>
                                            {selectedOrder.discount > 0 && (
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Discount</span>
                                                    <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tax</span>
                                                <span>₹{selectedOrder.tax?.toFixed(2) || "0.00"}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                                                <span>Total</span>
                                                <span>₹{selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking Info */}
                                    {selectedOrder.shippingTracking && (
                                        <div className="bg-purple-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-purple-900 flex items-center gap-2 mb-3">
                                                <Truck className="w-4 h-4" /> Shipping Tracking
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-sm text-purple-600">Carrier</p>
                                                    <p className="font-medium text-purple-900">{selectedOrder.shippingTracking.carrier}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-purple-600">Tracking Number</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-purple-900">{selectedOrder.shippingTracking.trackingNumber}</p>
                                                        <button
                                                            onClick={() => copyToClipboard(selectedOrder.shippingTracking?.trackingNumber || "")}
                                                            className="p-1 hover:bg-purple-100 rounded"
                                                        >
                                                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-purple-400" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                {selectedOrder.shippingTracking.trackingUrl && (
                                                    <div>
                                                        <p className="text-sm text-purple-600">Track Shipment</p>
                                                        <a
                                                            href={selectedOrder.shippingTracking.trackingUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-purple-700 hover:underline flex items-center gap-1"
                                                        >
                                                            Open Tracking <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking History */}
                                    {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                                <Calendar className="w-4 h-4" /> Order History
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedOrder.trackingHistory.slice().reverse().map((event, idx) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? "bg-green-500" : "bg-gray-300"}`} />
                                                            {idx < selectedOrder.trackingHistory!.length - 1 && (
                                                                <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-3">
                                                            <p className="font-medium text-gray-900">{event.message}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(event.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
