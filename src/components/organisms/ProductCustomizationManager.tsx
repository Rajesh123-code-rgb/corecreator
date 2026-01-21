"use client";

import * as React from "react";
import { Plus, Trash2, Palette, GripVertical, Settings } from "lucide-react";
import { Button, Input } from "@/components/atoms";
import { Card } from "@/components/molecules";

interface CustomizationOption {
    id: string;
    label: string;
    type: "text" | "image" | "color" | "select";
    required: boolean;
    priceModifier: number;
    options?: string[]; // For select/color
    maxLength?: number;
}

interface ProductCustomizationManagerProps {
    customizations: CustomizationOption[];
    onChange: (customizations: CustomizationOption[]) => void;
}

export default function ProductCustomizationManager({ customizations, onChange }: ProductCustomizationManagerProps) {

    const addCustomization = () => {
        const newOption: CustomizationOption = {
            id: Date.now().toString(),
            label: "New Customization",
            type: "text",
            required: false,
            priceModifier: 0
        };
        onChange([...customizations, newOption]);
    };

    const removeCustomization = (index: number) => {
        const newOpts = [...customizations];
        newOpts.splice(index, 1);
        onChange(newOpts);
    };

    const updateCustomization = (index: number, field: keyof CustomizationOption, value: any) => {
        const newOpts = [...customizations];
        newOpts[index] = { ...newOpts[index], [field]: value };
        onChange(newOpts);
    };

    const updateOptions = (index: number, optionsString: string) => {
        // Parse comma separated string to array
        const options = optionsString.split(",").map(s => s.trim()).filter(Boolean);
        updateCustomization(index, "options", options);
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Palette className="w-5 h-5 text-amber-500" />
                            Personalization Fields
                        </h3>
                        <p className="text-sm text-gray-500">
                            Define fields that customers must fill out or select (e.g. engravings, custom colors).
                        </p>
                    </div>
                    <Button onClick={addCustomization} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </div>

                {customizations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Settings className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No personalization options added yet.</p>
                        <Button variant="link" onClick={addCustomization}>Add your first customization field</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {customizations.map((field, index) => (
                            <div key={field.id} className="bg-white border boundary-gray-200 rounded-lg p-4 shadow-sm relative group">
                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeCustomization(index)} className="text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    {/* Drag Handle (Visual only for now) */}
                                    <div className="hidden md:flex col-span-1 justify-center pt-3 text-gray-300 cursor-move">
                                        <GripVertical className="w-5 h-5" />
                                    </div>

                                    {/* Main Config */}
                                    <div className="col-span-11 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="lg:col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Field Label</label>
                                            <Input
                                                value={field.label}
                                                onChange={(e) => updateCustomization(index, "label", e.target.value)}
                                                placeholder="e.g. Enter name for engraving"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Input Type</label>
                                            <select
                                                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
                                                value={field.type}
                                                onChange={(e) => updateCustomization(index, "type", e.target.value)}
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="image">Image Upload</option>
                                                <option value="select">Dropdown Selection</option>
                                                <option value="color">Color Picker</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Price Extra ($)</label>
                                            <Input
                                                type="number"
                                                value={field.priceModifier}
                                                onChange={(e) => updateCustomization(index, "priceModifier", parseFloat(e.target.value))}
                                                min={0}
                                            />
                                        </div>

                                        {/* Conditional Fields based on Type */}
                                        {field.type === "text" && (
                                            <div className="lg:col-span-2">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Max Characters</label>
                                                <Input
                                                    type="number"
                                                    value={field.maxLength || 50}
                                                    onChange={(e) => updateCustomization(index, "maxLength", parseInt(e.target.value))}
                                                    className="max-w-[150px]"
                                                />
                                            </div>
                                        )}

                                        {(field.type === "select" || field.type === "color") && (
                                            <div className="lg:col-span-4">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Options (comma separated)</label>
                                                <Input
                                                    value={field.options?.join(", ") || ""}
                                                    onChange={(e) => updateOptions(index, e.target.value)}
                                                    placeholder={field.type === "color" ? "Red, Blue, #FF0000" : "Option 1, Option 2"}
                                                />
                                            </div>
                                        )}

                                        <div className="lg:col-span-4 flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                id={`req-${field.id}`}
                                                checked={field.required}
                                                onChange={(e) => updateCustomization(index, "required", e.target.checked)}
                                                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <label htmlFor={`req-${field.id}`} className="text-sm text-gray-700">Required field</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
