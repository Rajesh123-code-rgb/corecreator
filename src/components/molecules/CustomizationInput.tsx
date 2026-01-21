"use client";

import React from "react";
import { Upload, X, AlertCircle } from "lucide-react";

interface CustomizationOption {
    id: string;
    label: string;
    type: "text" | "image" | "color" | "select";
    required: boolean;
    priceModifier: number;
    options?: string[];
    maxLength?: number;
}

interface CustomizationValue {
    id: string;
    value: string;
    priceModifier: number;
}

interface CustomizationInputProps {
    customizations: CustomizationOption[];
    values: CustomizationValue[];
    onChange: (values: CustomizationValue[]) => void;
}

export default function CustomizationInput({
    customizations,
    values,
    onChange
}: CustomizationInputProps) {
    const handleChange = (id: string, value: string, priceModifier: number) => {
        const existing = values.find(v => v.id === id);
        if (existing) {
            onChange(values.map(v => v.id === id ? { ...v, value } : v));
        } else {
            onChange([...values, { id, value, priceModifier }]);
        }
    };

    const getValue = (id: string) => values.find(v => v.id === id)?.value || "";

    if (!customizations || customizations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Personalization Options</span>
            </div>

            {customizations.map((option) => (
                <div key={option.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {option.label}
                        {option.required && <span className="text-red-500 ml-1">*</span>}
                        {option.priceModifier > 0 && (
                            <span className="text-amber-600 text-xs ml-2">+${option.priceModifier.toFixed(2)}</span>
                        )}
                    </label>

                    {option.type === "text" && (
                        <div>
                            <input
                                type="text"
                                value={getValue(option.id)}
                                onChange={(e) => handleChange(option.id, e.target.value, option.priceModifier)}
                                maxLength={option.maxLength || 50}
                                placeholder={`Enter ${option.label.toLowerCase()}`}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                            {option.maxLength && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {getValue(option.id).length}/{option.maxLength} characters
                                </p>
                            )}
                        </div>
                    )}

                    {option.type === "select" && option.options && (
                        <select
                            value={getValue(option.id)}
                            onChange={(e) => handleChange(option.id, e.target.value, option.priceModifier)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        >
                            <option value="">Select an option</option>
                            {option.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    )}

                    {option.type === "color" && option.options && (
                        <div className="flex flex-wrap gap-2">
                            {option.options.map((color) => {
                                const isHex = color.startsWith("#");
                                const isSelected = getValue(option.id) === color;

                                return (
                                    <button
                                        key={color}
                                        onClick={() => handleChange(option.id, color, option.priceModifier)}
                                        className={`
                                            w-8 h-8 rounded-full border-2 transition-transform
                                            ${isSelected ? "ring-2 ring-amber-500 ring-offset-2 scale-110" : "hover:scale-105"}
                                        `}
                                        style={{
                                            backgroundColor: isHex ? color : undefined,
                                            borderColor: isSelected ? "transparent" : "#e5e7eb"
                                        }}
                                        title={color}
                                    >
                                        {!isHex && (
                                            <span className="text-xs font-medium">{color.slice(0, 2)}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {option.type === "image" && (
                        <div className="relative">
                            {getValue(option.id) ? (
                                <div className="relative w-24 h-24">
                                    <img
                                        src={getValue(option.id)}
                                        alt="Uploaded"
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => handleChange(option.id, "", option.priceModifier)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors">
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Upload image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    handleChange(option.id, reader.result as string, option.priceModifier);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
