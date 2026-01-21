"use client";

import * as React from "react";
import { DollarSign, Info, TrendingUp } from "lucide-react";
import { Card } from "@/components/molecules";
import { calculatePriceBreakdown, DEFAULT_PRICING_CONFIG, formatPriceDisplay } from "@/lib/utils/pricingEngine";

interface PricingPreviewProps {
    basePrice: number;
    variantPrice?: number;
    customizationModifiers?: number[];
    addOnPrices?: number[];
    quantity?: number;
    currency?: string;
}

export default function PricingPreview({
    basePrice,
    variantPrice,
    customizationModifiers = [],
    addOnPrices = [],
    quantity = 1,
    currency = "USD"
}: PricingPreviewProps) {
    const breakdown = calculatePriceBreakdown(basePrice, {
        variantPrice,
        customizationModifiers,
        addOnPrices,
        quantity
    });

    const format = (amount: number) => formatPriceDisplay(amount, currency);

    return (
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900">Earnings Preview</h4>
            </div>

            <div className="space-y-3 text-sm">
                {/* Sale Price */}
                <div className="flex justify-between">
                    <span className="text-gray-600">Customer pays</span>
                    <span className="font-semibold text-gray-900">{format(breakdown.totalBuyerPays)}</span>
                </div>

                <div className="border-t border-green-200 pt-3 space-y-2">
                    {/* Base breakdown */}
                    <div className="flex justify-between text-gray-500">
                        <span>Base Price</span>
                        <span>{format(breakdown.basePrice)}</span>
                    </div>

                    {breakdown.variantModifier !== 0 && (
                        <div className="flex justify-between text-gray-500">
                            <span>Variant Adjustment</span>
                            <span>{breakdown.variantModifier > 0 ? "+" : ""}{format(breakdown.variantModifier)}</span>
                        </div>
                    )}

                    {breakdown.customizationFees > 0 && (
                        <div className="flex justify-between text-gray-500">
                            <span>Customizations</span>
                            <span>+{format(breakdown.customizationFees)}</span>
                        </div>
                    )}

                    {breakdown.addOnsFees > 0 && (
                        <div className="flex justify-between text-gray-500">
                            <span>Add-ons</span>
                            <span>+{format(breakdown.addOnsFees)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t border-green-200 pt-3 space-y-2">
                    {/* Fees */}
                    <div className="flex justify-between text-red-600">
                        <span className="flex items-center gap-1">
                            Platform Fee ({DEFAULT_PRICING_CONFIG.platformCommission}%)
                            <Info className="w-3 h-3" />
                        </span>
                        <span>-{format(breakdown.platformFee)}</span>
                    </div>

                    <div className="flex justify-between text-red-600">
                        <span>Payment Processing ({DEFAULT_PRICING_CONFIG.paymentProcessingFee}%)</span>
                        <span>-{format(breakdown.processingFee)}</span>
                    </div>
                </div>

                <div className="border-t-2 border-green-300 pt-3">
                    <div className="flex justify-between">
                        <span className="font-semibold text-green-900">You Receive</span>
                        <span className="text-xl font-bold text-green-600">{format(breakdown.sellerReceives)}</span>
                    </div>

                    {quantity > 1 && (
                        <p className="text-xs text-gray-500 mt-1">
                            Per unit: {format(breakdown.sellerReceives / quantity)}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
