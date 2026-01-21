"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewProductPage() {
    const router = useRouter();
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const createProduct = async () => {
            // Check KYC first
            const kycRes = await fetch("/api/studio/verification/status");
            if (kycRes.ok) {
                const kycData = await kycRes.json();
                if (kycData.status !== "approved") {
                    router.replace("/studio/verification");
                    return;
                }
            }

            try {
                const res = await fetch("/api/studio/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: "Untitled Product",
                        status: "draft"
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Failed to create product");
                    return;
                }

                if (data.product?.id) {
                    router.replace(`/studio/products/${data.product.id}/edit`);
                } else {
                    setError("Product created but no ID returned");
                }
            } catch (err) {
                console.error("Failed to create product:", err);
                setError("An unexpected error occurred");
            }
        };

        createProduct();
    }, [router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="text-red-500 text-lg font-medium">{error}</div>
                <button
                    onClick={() => router.push("/studio/products")}
                    className="text-amber-600 hover:underline"
                >
                    Go back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-gray-500">Creating your new product...</p>
        </div>
    );
}
