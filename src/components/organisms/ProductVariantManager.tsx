"use client";

import * as React from "react";
import { Plus, Trash2, Box, Copy } from "lucide-react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface VariantAttribute {
    name: string; // e.g. "Size"
    values: string[]; // e.g. ["S", "M", "L"]
}

interface ProductVariant {
    id: string;
    attributes: { name: string; value: string }[];
    price: number;
    stock: number;
    sku: string;
}

interface ProductVariantManagerProps {
    basePrice: number;
    variants: ProductVariant[];
    attributes?: VariantAttribute[]; // Saved attributes configuration
    onChange: (variants: ProductVariant[], attributes: VariantAttribute[]) => void;
}

export default function ProductVariantManager({
    basePrice,
    variants,
    attributes: initialAttributes = [],
    onChange
}: ProductVariantManagerProps) {
    const [attributes, setAttributes] = React.useState<VariantAttribute[]>(initialAttributes);
    const [newAttrName, setNewAttrName] = React.useState("");

    // Generate variants when attributes change
    const generateVariants = () => {
        // If no attributes, no variants
        if (attributes.length === 0) {
            onChange([], []);
            return;
        }

        // Recursive function to generate combinations
        const updatedVariants: ProductVariant[] = [];

        const generateCombinations = (
            attrIndex: number,
            currentAttrs: { name: string; value: string }[]
        ) => {
            if (attrIndex === attributes.length) {
                // Leaf node: create variant
                // Check if this variant already exists to preserve data
                const variantId = currentAttrs.map(a => `${a.name}:${a.value}`).join("|");
                const existing = variants.find(v => {
                    return currentAttrs.every(ca =>
                        v.attributes.some(va => va.name === ca.name && va.value === ca.value)
                    );
                });

                updatedVariants.push(existing || {
                    id: variantId,
                    attributes: currentAttrs,
                    price: basePrice,
                    stock: 0,
                    sku: ""
                });
                return;
            }

            const currentAttr = attributes[attrIndex];
            if (currentAttr.values.length === 0) return; // Skip empty attributes

            for (const val of currentAttr.values) {
                generateCombinations(attrIndex + 1, [...currentAttrs, { name: currentAttr.name, value: val }]);
            }
        };

        generateCombinations(0, []);
        onChange(updatedVariants, attributes);
    };

    const addAttribute = () => {
        if (!newAttrName.trim()) return;
        setAttributes([...attributes, { name: newAttrName, values: [] }]);
        setNewAttrName("");
    };

    const removeAttribute = (index: number) => {
        const newAttrs = [...attributes];
        newAttrs.splice(index, 1);
        setAttributes(newAttrs);
        // We'll trigger regeneration via effect or manual button?
        // Let's do it manually for now to prevent data loss accidents
    };

    const addValue = (attrIndex: number, value: string) => {
        if (!value.trim()) return;
        const newAttrs = [...attributes];
        if (!newAttrs[attrIndex].values.includes(value)) {
            newAttrs[attrIndex].values.push(value);
            setAttributes(newAttrs);
        }
    };

    const removeValue = (attrIndex: number, valIndex: number) => {
        const newAttrs = [...attributes];
        newAttrs[attrIndex].values.splice(valIndex, 1);
        setAttributes(newAttrs);
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        onChange(newVariants, attributes);
    };

    // Auto-generate on attribute change effect? 
    // Maybe better to have a "Apply/Generate" button to be explicit.

    return (
        <div className="space-y-8">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Box className="w-5 h-5 text-amber-500" />
                        Option Types
                    </h3>
                </div>

                <div className="space-y-6">
                    {attributes.map((attr, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-gray-900">{attr.name}</span>
                                <button onClick={() => removeAttribute(i)} className="text-red-500 hover:text-red-600 text-sm">
                                    Remove
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {attr.values.map((val, j) => (
                                    <span key={j} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800">
                                        {val}
                                        <button onClick={() => removeValue(i, j)} className="ml-1.5 text-gray-400 hover:text-red-500">
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    className="h-8 text-sm"
                                    placeholder={`Add value for ${attr.name} (Enter)`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addValue(i, e.currentTarget.value);
                                            e.currentTarget.value = "";
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-2 items-center">
                        <Input
                            value={newAttrName}
                            onChange={(e) => setNewAttrName(e.target.value)}
                            placeholder="Add new option (e.g. Size, Color)"
                            className="max-w-xs"
                        />
                        <Button variant="outline" onClick={addAttribute} disabled={!newAttrName}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <Button onClick={generateVariants} className="w-full sm:w-auto">
                            Generate Variants Configuration
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                            Clicking generate will update the table below based on your options.
                        </p>
                    </div>
                </div>
            </Card>

            {variants.length > 0 && (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-500">Variant</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 w-32">Price ($)</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 w-32">Stock</th>
                                    <th className="px-4 py-3 font-medium text-gray-500 w-40">SKU</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {variants.map((variant, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">
                                                {variant.attributes.map(a => a.value).join(" / ")}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="number"
                                                className="h-8"
                                                value={variant.price}
                                                onChange={(e) => updateVariant(index, "price", parseFloat(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                type="number"
                                                className="h-8"
                                                value={variant.stock}
                                                onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                className="h-8"
                                                value={variant.sku}
                                                onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    )
}
