"use client";

import React from "react";
import { Check } from "lucide-react";

interface ProductVariant {
    id: string;
    attributes: { name: string; value: string }[];
    price: number;
    stock: number;
    sku?: string;
}

interface VariantSelectorProps {
    variants: ProductVariant[];
    basePrice: number;
    selectedVariant: ProductVariant | null;
    onSelect: (variant: ProductVariant) => void;
}

export default function VariantSelector({
    variants,
    basePrice,
    selectedVariant,
    onSelect
}: VariantSelectorProps) {
    // Group variants by attribute name
    const attributeGroups = React.useMemo(() => {
        const groups: Record<string, string[]> = {};

        variants.forEach(variant => {
            variant.attributes.forEach(attr => {
                if (!groups[attr.name]) {
                    groups[attr.name] = [];
                }
                if (!groups[attr.name].includes(attr.value)) {
                    groups[attr.name].push(attr.value);
                }
            });
        });

        return groups;
    }, [variants]);

    // Track selected values for each attribute
    const [selectedAttributes, setSelectedAttributes] = React.useState<Record<string, string>>(() => {
        if (selectedVariant) {
            const initial: Record<string, string> = {};
            selectedVariant.attributes.forEach(attr => {
                initial[attr.name] = attr.value;
            });
            return initial;
        }
        return {};
    });

    // Find matching variant when attributes change
    React.useEffect(() => {
        const attrNames = Object.keys(attributeGroups);
        const allSelected = attrNames.every(name => selectedAttributes[name]);

        if (allSelected) {
            const match = variants.find(v =>
                v.attributes.every(attr => selectedAttributes[attr.name] === attr.value)
            );
            if (match && match.id !== selectedVariant?.id) {
                onSelect(match);
            }
        }
    }, [selectedAttributes, variants, attributeGroups, selectedVariant, onSelect]);

    // Check if a specific attribute value is available given current selections
    const isValueAvailable = (attrName: string, value: string) => {
        const testAttrs = { ...selectedAttributes, [attrName]: value };
        return variants.some(v => {
            return v.attributes.every(attr => {
                if (attr.name === attrName) return attr.value === value;
                if (!testAttrs[attr.name]) return true; // Not selected yet, consider available
                return attr.value === testAttrs[attr.name];
            }) && v.stock > 0;
        });
    };

    const handleSelect = (attrName: string, value: string) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attrName]: value
        }));
    };

    if (!variants || variants.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {Object.entries(attributeGroups).map(([attrName, values]) => (
                <div key={attrName}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {attrName}: <span className="text-gray-500">{selectedAttributes[attrName] || "Select"}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {values.map(value => {
                            const isSelected = selectedAttributes[attrName] === value;
                            const isAvailable = isValueAvailable(attrName, value);

                            return (
                                <button
                                    key={value}
                                    onClick={() => isAvailable && handleSelect(attrName, value)}
                                    disabled={!isAvailable}
                                    className={`
                                        relative px-4 py-2 rounded-lg border text-sm font-medium transition-all
                                        ${isSelected
                                            ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20"
                                            : isAvailable
                                                ? "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                                                : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                                        }
                                    `}
                                >
                                    {value}
                                    {isSelected && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Stock & Price Info */}
            {selectedVariant && (
                <div className="pt-2 text-sm">
                    {selectedVariant.stock > 0 ? (
                        <span className={`${selectedVariant.stock <= 5 ? "text-orange-600" : "text-green-600"}`}>
                            {selectedVariant.stock <= 5 ? `Only ${selectedVariant.stock} left!` : "In Stock"}
                        </span>
                    ) : (
                        <span className="text-red-600">Out of Stock</span>
                    )}
                    {selectedVariant.sku && (
                        <span className="text-gray-400 ml-3">SKU: {selectedVariant.sku}</span>
                    )}
                </div>
            )}
        </div>
    );
}
