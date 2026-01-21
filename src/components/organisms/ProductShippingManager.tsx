"use client";

import * as React from "react";
import { Truck, Package, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface ShippingConfig {
    requiresShipping: boolean;
    weight?: number; // kg
    width?: number; // cm
    height?: number; // cm  
    depth?: number; // cm (length)
    processingTime?: string;
    shippingProfile?: string;
}

interface ProductShippingManagerProps {
    shipping: ShippingConfig;
    productType: "physical" | "digital" | "service";
    onChange: (shipping: ShippingConfig) => void;
}

const PROCESSING_OPTIONS = [
    { value: "1-2 days", label: "1-2 business days" },
    { value: "3-5 days", label: "3-5 business days" },
    { value: "1 week", label: "1 week" },
    { value: "2 weeks", label: "2 weeks" },
    { value: "3-4 weeks", label: "3-4 weeks (made to order)" },
    { value: "custom", label: "Custom timeframe" },
];

export default function ProductShippingManager({
    shipping,
    productType,
    onChange
}: ProductShippingManagerProps) {
    const [customProcessing, setCustomProcessing] = React.useState("");
    const [profiles, setProfiles] = React.useState<{ _id: string, name: string, isDefault: boolean }[]>([]);

    React.useEffect(() => {
        fetch("/api/studio/shipping/profiles")
            .then(res => res.json())
            .then(data => {
                if (data.profiles) setProfiles(data.profiles);
            })
            .catch(err => console.error("Failed to fetch shipping profiles", err));
    }, []);

    const handleUpdate = (field: keyof ShippingConfig, value: any) => {
        onChange({ ...shipping, [field]: value });
    };

    // Digital products don't require shipping
    if (productType === "digital") {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-4 text-gray-500">
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Digital Product</h3>
                        <p className="text-sm">This is a digital product and does not require shipping configuration.</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Shipping Toggle */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <Truck className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Physical Shipping</h3>
                            <p className="text-sm text-gray-500">This product requires physical delivery</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={shipping.requiresShipping}
                            onChange={(e) => handleUpdate("requiresShipping", e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>

                {shipping.requiresShipping && (
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Profile</label>
                        <select
                            value={shipping.shippingProfile || ""}
                            onChange={(e) => handleUpdate("shippingProfile", e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                            <option value="">-- Manual Calculation (Use dimensions below) --</option>
                            {profiles.map(p => (
                                <option key={p._id} value={p._id}>{p.name} {p.isDefault ? "(Default)" : ""}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select a saved shipping profile or configure manual dimensional weight below.
                        </p>
                    </div>
                )}
            </Card>

            {shipping.requiresShipping && (
                <>
                    {/* Processing Time */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Processing Time
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            How long does it take you to prepare and ship this item?
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {PROCESSING_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        if (option.value === "custom") {
                                            handleUpdate("processingTime", customProcessing || "Custom");
                                        } else {
                                            handleUpdate("processingTime", option.value);
                                        }
                                    }}
                                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${shipping.processingTime === option.value
                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {shipping.processingTime === "custom" && (
                            <div className="mt-4">
                                <Input
                                    value={customProcessing}
                                    onChange={(e) => {
                                        setCustomProcessing(e.target.value);
                                        handleUpdate("processingTime", e.target.value);
                                    }}
                                    placeholder="e.g. 4-6 weeks for custom commissions"
                                />
                            </div>
                        )}
                    </Card>

                    {/* Package Dimensions */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-500" />
                            Package Dimensions
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Enter the packed dimensions for accurate shipping rate calculations.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={shipping.weight || ""}
                                    onChange={(e) => handleUpdate("weight", parseFloat(e.target.value) || undefined)}
                                    placeholder="0.0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Length (cm)</label>
                                <Input
                                    type="number"
                                    value={shipping.depth || ""}
                                    onChange={(e) => handleUpdate("depth", parseFloat(e.target.value) || undefined)}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Width (cm)</label>
                                <Input
                                    type="number"
                                    value={shipping.width || ""}
                                    onChange={(e) => handleUpdate("width", parseFloat(e.target.value) || undefined)}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Height (cm)</label>
                                <Input
                                    type="number"
                                    value={shipping.height || ""}
                                    onChange={(e) => handleUpdate("height", parseFloat(e.target.value) || undefined)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-700">
                                Accurate dimensions help calculate correct shipping costs and avoid undercharging.
                                Include any protective packaging in your measurements.
                            </p>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
