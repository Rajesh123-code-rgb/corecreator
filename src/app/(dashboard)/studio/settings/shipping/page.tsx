"use client";

import * as React from "react";
import ShippingProfileManager from "@/components/organisms/ShippingProfileManager";

export default function ShippingSettingsPage() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-8">Shipping Settings</h1>
            <ShippingProfileManager />
        </div>
    );
}
