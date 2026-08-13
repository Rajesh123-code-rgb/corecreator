"use client";

import * as React from "react";
import { Button } from "@/components/atoms";
import { Download, Loader2 } from "lucide-react";

export interface InvoiceItem {
    name: string;
    itemType?: string;
    quantity: number;
    price: number;
}

export interface InvoiceOrder {
    orderNumber: string;
    createdAt: string | Date;
    items: InvoiceItem[];
    subtotal?: number;
    tax?: number;
    shipping?: number;
    discount?: number;
    total: number;
    currency?: string;
    paymentMethod?: string;
    customerName?: string;
    customerEmail?: string;
    shippingAddress?: {
        fullName?: string;
        addressLine1?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
    };
}

interface Props {
    order: InvoiceOrder;
    variant?: "default" | "secondary" | "outline" | "ghost";
    size?: "sm" | "default" | "lg";
    className?: string;
    label?: string;
}

/** Rupee amounts, formatted for the document rather than the page. */
const money = (n: number) =>
    `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Generates a plain, printable invoice for an order.
 *
 * jsPDF is imported on click for the same reason CertificateDownloadButton does
 * it - the library is large and belongs nowhere near the shared bundle.
 */
export function InvoiceDownloadButton({
    order,
    variant = "outline",
    size = "sm",
    className = "",
    label = "Invoice",
}: Props) {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const { default: jsPDF } = await import("jspdf");
            const doc = new jsPDF({ unit: "mm", format: "a4" });

            const LEFT = 18;
            const RIGHT = 192;
            let y = 22;

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.setTextColor(23, 23, 23);
            doc.text("Core Creator", LEFT, y);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(110, 110, 110);
            doc.text("Jaipur, Rajasthan, India", LEFT, y + 6);
            doc.text("corecreator.online", LEFT, y + 11);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(23, 23, 23);
            doc.text("INVOICE", RIGHT, y, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(110, 110, 110);
            doc.text(order.orderNumber, RIGHT, y + 6, { align: "right" });
            doc.text(
                new Intl.DateTimeFormat("en-GB", {
                    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
                }).format(new Date(order.createdAt)),
                RIGHT, y + 11, { align: "right" }
            );

            y += 22;
            doc.setDrawColor(224, 224, 224);
            doc.line(LEFT, y, RIGHT, y);
            y += 10;

            // Billed to
            const addr = order.shippingAddress;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(110, 110, 110);
            doc.text("BILLED TO", LEFT, y);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(23, 23, 23);
            doc.setFontSize(10);
            y += 6;
            const lines = [
                addr?.fullName || order.customerName || "",
                order.customerEmail || "",
                addr?.addressLine1 || "",
                [addr?.city, addr?.state, addr?.postalCode].filter(Boolean).join(", "),
                addr?.country || "",
                addr?.phone || "",
            ].filter(Boolean);
            lines.forEach((line) => { doc.text(String(line), LEFT, y); y += 5; });

            y += 8;

            // Items table
            doc.setFillColor(245, 245, 245);
            doc.rect(LEFT, y - 5, RIGHT - LEFT, 8, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(90, 90, 90);
            doc.text("DESCRIPTION", LEFT + 2, y);
            doc.text("QTY", 132, y, { align: "right" });
            doc.text("RATE", 158, y, { align: "right" });
            doc.text("AMOUNT", RIGHT - 2, y, { align: "right" });
            y += 9;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(23, 23, 23);
            doc.setFontSize(10);
            order.items.forEach((item) => {
                const name = String(item.name || "").slice(0, 52);
                doc.text(name, LEFT + 2, y);
                if (item.itemType) {
                    doc.setFontSize(8);
                    doc.setTextColor(130, 130, 130);
                    doc.text(String(item.itemType), LEFT + 2, y + 4);
                    doc.setFontSize(10);
                    doc.setTextColor(23, 23, 23);
                }
                doc.text(String(item.quantity), 132, y, { align: "right" });
                doc.text(money(item.price), 158, y, { align: "right" });
                doc.text(money(item.price * item.quantity), RIGHT - 2, y, { align: "right" });
                y += item.itemType ? 11 : 8;
            });

            y += 2;
            doc.setDrawColor(224, 224, 224);
            doc.line(120, y, RIGHT, y);
            y += 7;

            const row = (labelText: string, value: string, bold = false) => {
                doc.setFont("helvetica", bold ? "bold" : "normal");
                doc.setFontSize(bold ? 11 : 10);
                doc.setTextColor(bold ? 23 : 110, bold ? 23 : 110, bold ? 23 : 110);
                doc.text(labelText, 158, y, { align: "right" });
                doc.setTextColor(23, 23, 23);
                doc.text(value, RIGHT - 2, y, { align: "right" });
                y += bold ? 8 : 6;
            };

            if (order.subtotal != null) row("Subtotal", money(order.subtotal));
            if (order.discount) row("Discount", `-${money(order.discount)}`);
            if (order.shipping != null) row("Shipping", order.shipping === 0 ? "Free" : money(order.shipping));
            if (order.tax != null) row("GST", money(order.tax));
            row("Total", money(order.total), true);

            y += 6;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(130, 130, 130);
            if (order.paymentMethod) {
                doc.text(`Paid via ${order.paymentMethod}`, LEFT, y);
                y += 5;
            }
            doc.text("This is a computer-generated invoice and does not require a signature.", LEFT, y);

            doc.save(`invoice-${order.orderNumber}.pdf`);
        } catch (error) {
            console.error("Invoice generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleDownload}
            disabled={isGenerating}
            aria-label={`Download invoice for order ${order.orderNumber}`}
        >
            {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing…</>
            ) : (
                <><Download className="w-4 h-4 mr-2" /> {label}</>
            )}
        </Button>
    );
}
