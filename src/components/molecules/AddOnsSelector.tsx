"use client";

import React from "react";
import { Gift, Zap, Package, Check } from "lucide-react";

interface AddOn {
    id: string;
    title: string;
    description?: string;
    price: number;
    active: boolean;
}

interface AddOnsSelectorProps {
    addOns: AddOn[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

// Icon mapping for common add-ons
const getAddOnIcon = (id: string, title: string) => {
    const lower = (id + title).toLowerCase();
    if (lower.includes("gift") || lower.includes("wrap")) return Gift;
    if (lower.includes("rush") || lower.includes("express") || lower.includes("fast")) return Zap;
    return Package;
};

export default function AddOnsSelector({
    addOns,
    selected,
    onChange
}: AddOnsSelectorProps) {
    const activeAddOns = addOns.filter(a => a.active);

    if (activeAddOns.length === 0) {
        return null;
    }

    const toggleAddOn = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const totalAddOnsPrice = activeAddOns
        .filter(a => selected.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Add-ons</span>
                {totalAddOnsPrice > 0 && (
                    <span className="text-sm text-amber-600">+${totalAddOnsPrice.toFixed(2)}</span>
                )}
            </div>

            <div className="space-y-2">
                {activeAddOns.map((addOn) => {
                    const Icon = getAddOnIcon(addOn.id, addOn.title);
                    const isSelected = selected.includes(addOn.id);

                    return (
                        <button
                            key={addOn.id}
                            onClick={() => toggleAddOn(addOn.id)}
                            className={`
                                w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                                ${isSelected
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                }
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center
                                ${isSelected ? "bg-amber-100" : "bg-gray-100"}
                            `}>
                                <Icon className={`w-4 h-4 ${isSelected ? "text-amber-600" : "text-gray-500"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isSelected ? "text-amber-700" : "text-gray-900"}`}>
                                    {addOn.title}
                                </p>
                                {addOn.description && (
                                    <p className="text-xs text-gray-500 truncate">{addOn.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isSelected ? "text-amber-600" : "text-gray-600"}`}>
                                    +${addOn.price.toFixed(2)}
                                </span>
                                <div className={`
                                    w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                                    ${isSelected
                                        ? "border-amber-500 bg-amber-500"
                                        : "border-gray-300"
                                    }
                                `}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
