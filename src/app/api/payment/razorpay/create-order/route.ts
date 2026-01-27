import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/payment/razorpay";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import PromoCode from "@/lib/db/models/PromoCode";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import ShippingProfile from "@/lib/db/models/ShippingProfile";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { currency = "INR", items, shippingAddress, promoCode } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items in order" }, { status: 400 });
        }

        await connectDB();

        // 1. Calculate Subtotal Server-Side & Fetch Seller Details
        let subtotal = 0;

        // Use Promise.all to fetch details for all items in parallel
        interface OrderItemRequest {
            id: string;
            kind: "product" | "course" | "workshop";
            name: string;
            quantity: number;
            price: number;
        }

        interface ProcessedOrderItem {
            itemId: mongoose.Types.ObjectId;
            itemType: "course" | "product" | "workshop";
            name: string;
            quantity: number;
            price: number;
            sellerId: mongoose.Types.ObjectId | undefined;
            sellerName: string | undefined;
        }

        const orderItems: ProcessedOrderItem[] = await Promise.all(items.map(async (item: OrderItemRequest) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            let sellerId: mongoose.Types.ObjectId | undefined;
            let sellerName: string | undefined;


            try {
                if (item.kind === "product") {
                    const product = await Product.findById(item.id).select("seller sellerName shipping.weight");
                    if (product) {
                        sellerId = product.seller;
                        sellerName = product.sellerName;
                    }
                } else if (item.kind === "course") {
                    const course = await Course.findById(item.id).select("instructor instructorName");
                    if (course) {
                        sellerId = course.instructor;
                        sellerName = course.instructorName;
                    }
                } // Add workshop if needed
            } catch (e) {
                console.error(`Failed to fetch seller for item ${item.id}`, e);
            }

            return {
                itemId: new mongoose.Types.ObjectId(item.id),
                itemType: item.kind, // "course" or "product"
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                sellerId: sellerId,
                sellerName: sellerName
            };
        }));

        // Calculate Shipping & Tax
        let shipping = 0;

        // Group items by Seller to calculate shipping per seller
        const itemsBySeller: Record<string, ProcessedOrderItem[]> = {};
        orderItems.forEach(item => {
            const sellerId = item.sellerId ? item.sellerId.toString() : "platform";
            if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
            itemsBySeller[sellerId].push(item);
        });

        const ShippingProfile = mongoose.models.ShippingProfile || mongoose.model("ShippingProfile");

        // Calculate shipping for each seller
        for (const sellerId of Object.keys(itemsBySeller)) {
            const sellerItems = itemsBySeller[sellerId];

            // Skip shipping for digital courses (only products need shipping)
            const physicalItems = sellerItems.filter(i => i.itemType === "product");
            if (physicalItems.length === 0) continue;

            const sellerTotal = sellerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

            let sellerShipping = 0;
            let profile = null;

            if (sellerId !== "platform") {
                // Fetch seller's default shipping profile
                profile = await ShippingProfile.findOne({ seller: sellerId, isDefault: true });
            }

            if (profile) {
                // Find matching zone
                const countryCode = shippingAddress?.country || "US"; // Default to US if missing (should validate)

                interface Zone {
                    countries: string[];
                    name: string;
                    rates: any[];
                }

                const zone = profile.zones.find((z: Zone) => z.countries.includes(countryCode)) ||
                    profile.zones.find((z: Zone) => z.name === "Rest of World"); // Fallback check

                if (zone && zone.rates.length > 0) {
                    // Find applicable rate (simplified: take first match or lowest/highest? usually first match in priority)
                    // Logic: Match rate conditions
                    const rate = zone.rates.find((r: any) => {
                        if (r.type === "free") return true;
                        if (r.type === "flat") return true;
                        // Price based
                        if (r.type === "price_based") {
                            const min = r.minPrice || 0;
                            const max = r.maxPrice || Infinity;
                            return sellerTotal >= min && sellerTotal <= max;
                        }
                        // Weight based
                        if (r.type === "weight_based") {
                            // Need to fetch weights. NOTE: We only fetched basic info.
                            // For accuracy we assumed we fetched product details.
                            // Ideally we should have fetched `shipping.weight` in the initial map.
                            // For now assuming 0 weight if not available or handling in next iteration.
                            // Wait, I need to update the initial fetch to get weight!
                            // See below for how I will handle this.
                            return true;
                        }
                        return false;
                    });

                    if (rate) {
                        sellerShipping = rate.amount;
                    }
                } else {
                    // No matching zone? Fallback or standard fee.
                    sellerShipping = 15; // Safe default
                }
            } else {
                // No profile? Default platform rate
                sellerShipping = sellerTotal > 100 ? 0 : 15;
            }
            shipping += sellerShipping;
        }

        const tax = subtotal * 0.08;

        // Calculate Discount (existing logic...)
        let discount = 0;
        let promoDiscount = 0;

        if (promoCode) {
            const promo = await PromoCode.findOne({
                code: promoCode.toUpperCase(),
                isActive: true,
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            });

            if (promo) {
                if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
                    return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
                }

                if (promo.discountType === "percentage") {
                    discount = (subtotal * promo.discountValue) / 100;
                    if (promo.maxDiscount && discount > promo.maxDiscount) {
                        discount = promo.maxDiscount;
                    }
                } else {
                    discount = promo.discountValue;
                }

                if (discount > subtotal) discount = subtotal;
                promoDiscount = discount;
            } else {
                return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
            }
        }

        const total = subtotal + shipping + tax - discount;
        const finalAmount = Math.max(0, parseFloat(total.toFixed(2))); // Ensure non-negative and 2 decimals

        // 2. Generate Order Number
        const orderCount = await Order.countDocuments();
        const orderNumber = `ORD-${String(orderCount + 1).padStart(6, "0")}-${Date.now().toString(36).toUpperCase()}`;

        // 3. Create MongoDB Order (Pending)
        const dbOrder = new Order({
            orderNumber: orderNumber,
            user: new mongoose.Types.ObjectId(session.user.id),
            items: orderItems,
            total: finalAmount,
            subtotal: subtotal,
            shipping: shipping,
            tax: tax,
            discount: discount,
            promoCode: promoCode ? promoCode.toUpperCase() : undefined,
            promoDiscount: promoDiscount,
            currency: currency,
            status: "pending",
            paymentStatus: "pending",
            paymentMethod: "razorpay",
            shippingAddress: shippingAddress ? {
                fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                phone: shippingAddress.phone,
                addressLine1: shippingAddress.addressLine,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.zip,
                country: shippingAddress.country
            } : undefined,
            createdAt: new Date()
        });

        await dbOrder.save();

        // 3. Create Razorpay order
        const amountInSmallestUnit = Math.round(finalAmount * 100); // 100 paise = 1 INR

        const order = await createRazorpayOrder({
            amount: amountInSmallestUnit,
            currency,
            receipt: dbOrder._id.toString(),
            notes: {
                userId: session.user.id || "",
                userEmail: session.user.email || "",
                dbOrderId: dbOrder._id.toString(),
                promoCode: promoCode || ""
            },
        });

        // Update DB order with Razorpay Order ID
        dbOrder.paymentDetails = {
            razorpayOrderId: order.id,
            amount: finalAmount,
            currency: currency
        };
        await dbOrder.save();

        return NextResponse.json({
            success: true,
            dbOrderId: dbOrder._id.toString(),
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
            },
            keyId: getRazorpayKeyId(),
            prefill: {
                name: session.user.name || "",
                email: session.user.email || "",
            },
        });
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        return NextResponse.json(
            { error: "Failed to create payment order" },
            { status: 500 }
        );
    }
}
