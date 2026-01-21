"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Package,
    Loader2,
    Upload,
    X,
    Image as ImageIcon,
    Video,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/atoms";

interface EligibleOrder {
    _id: string;
    orderNumber: string;
    createdAt: string;
    items: {
        itemId: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
    }[];
}

const REASON_OPTIONS = [
    { value: "damaged", label: "Damaged Product", description: "Product arrived damaged or broken" },
    { value: "wrong_item", label: "Wrong Item Received", description: "Received different item than ordered" },
    { value: "not_as_described", label: "Not as Described", description: "Product doesn't match listing" },
    { value: "defective", label: "Defective Product", description: "Product doesn't work properly" },
    { value: "other", label: "Other", description: "Other reason" },
];

export default function NewReturnRequestPage() {
    const router = useRouter();
    const [orders, setOrders] = React.useState<EligibleOrder[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);
    const [success, setSuccess] = React.useState(false);

    // Form state
    const [selectedOrder, setSelectedOrder] = React.useState<string>("");
    const [selectedItem, setSelectedItem] = React.useState<string>("");
    const [requestType, setRequestType] = React.useState<"return" | "refund">("refund");
    const [reason, setReason] = React.useState<string>("");
    const [description, setDescription] = React.useState<string>("");
    const [evidence, setEvidence] = React.useState<{ type: "image" | "video"; url: string; filename: string }[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const [error, setError] = React.useState<string>("");

    React.useEffect(() => {
        fetchEligibleOrders();
    }, []);

    const fetchEligibleOrders = async () => {
        try {
            const res = await fetch("/api/user/returns/eligible-orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch eligible orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (evidence.length + files.length > 5) {
            setError("Maximum 5 files allowed");
            return;
        }

        setUploading(true);
        setError("");

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", "returns");

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    const type = file.type.startsWith("video/") ? "video" : "image";
                    setEvidence((prev) => [...prev, { type, url: data.url, filename: file.name }]);
                }
            } catch (error) {
                console.error("Upload failed:", error);
                setError("Failed to upload file");
            }
        }

        setUploading(false);
        e.target.value = "";
    };

    const removeEvidence = (index: number) => {
        setEvidence((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!selectedOrder || !selectedItem || !reason || !description) {
            setError("Please fill in all required fields");
            return;
        }

        if (evidence.length === 0) {
            setError("Please upload at least one photo or video as evidence");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/user/returns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: selectedOrder,
                    itemId: selectedItem,
                    type: requestType,
                    reason,
                    description,
                    evidence,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/user/returns");
                }, 2000);
            } else {
                setError(data.error || "Failed to submit request");
            }
        } catch (error) {
            setError("Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    const selectedOrderData = orders.find((o) => o._id === selectedOrder);

    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                    <p className="text-gray-500 mb-4">
                        Your return/refund request has been submitted successfully. We'll review it and get back to you soon.
                    </p>
                    <Link href="/user/returns">
                        <Button>View My Requests</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/user/returns" className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Return/Refund Request</h1>
                    <p className="text-gray-500 mt-1">Submit a request for a delivered product</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No eligible orders found</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Only delivered orders with physical products are eligible for returns
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Order Selection */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900">Select Order & Product</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                            <select
                                value={selectedOrder}
                                onChange={(e) => {
                                    setSelectedOrder(e.target.value);
                                    setSelectedItem("");
                                }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            >
                                <option value="">Select an order...</option>
                                {orders.map((order) => (
                                    <option key={order._id} value={order._id}>
                                        {order.orderNumber} - {new Date(order.createdAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedOrderData && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                                <div className="space-y-2">
                                    {selectedOrderData.items.map((item) => (
                                        <label
                                            key={item.itemId}
                                            className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${selectedItem === item.itemId
                                                    ? "border-purple-500 bg-purple-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="item"
                                                value={item.itemId}
                                                checked={selectedItem === item.itemId}
                                                onChange={(e) => setSelectedItem(e.target.value)}
                                                className="sr-only"
                                            />
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity} • ₹{item.price}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Request Type */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900">Request Type</h2>
                        <div className="flex gap-4">
                            {[
                                { value: "return", label: "Return", desc: "Return item and get refund" },
                                { value: "refund", label: "Refund Only", desc: "Keep item and get refund" },
                            ].map((type) => (
                                <label
                                    key={type.value}
                                    className={`flex-1 p-4 border rounded-xl cursor-pointer transition-colors ${requestType === type.value
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type.value}
                                        checked={requestType === type.value}
                                        onChange={(e) => setRequestType(e.target.value as any)}
                                        className="sr-only"
                                    />
                                    <p className="font-medium text-gray-900">{type.label}</p>
                                    <p className="text-sm text-gray-500">{type.desc}</p>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900">Reason for Request</h2>
                        <div className="space-y-2">
                            {REASON_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${reason === option.value
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={option.value}
                                        checked={reason === option.value}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">{option.label}</p>
                                        <p className="text-sm text-gray-500">{option.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Please describe the issue in detail..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Evidence Upload */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="font-semibold text-gray-900">Evidence (Photos/Videos)</h2>
                        <p className="text-sm text-gray-500">Upload photos or videos showing the issue. Max 5 files.</p>

                        {evidence.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {evidence.map((file, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {file.type === "image" ? (
                                                <img src={file.url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Video className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeEvidence(idx)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {evidence.length < 5 && (
                            <label className="flex items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-purple-400 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="sr-only"
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-gray-500">Click to upload files</span>
                                    </>
                                )}
                            </label>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Request"
                        )}
                    </Button>
                </form>
            )}
        </div>
    );
}
