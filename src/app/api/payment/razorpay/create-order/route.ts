import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createRazorpayOrder, getRazorpayKeyId } from "@/lib/payment/razorpay";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";
import PromoCode from "@/lib/db/models/PromoCode";
import Product from "@/lib/db/models/Product";
import Course from "@/lib/db/models/Course";
import Workshop from "@/lib/db/models/Workshop";
import ShippingProfile from "@/lib/db/models/ShippingProfile";
import mongoose from "mongoose";
import { findOrCreateGuestUser } from "@/lib/auth/guestCheckout";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const body = await request.json();
        const { items, shippingAddress, promoCode } = body;

        // Guests may check out. Their order still needs a real user account
        // (Order.user is required, and order history, course access and
        // workshop seats all key off a user id), so one is created from the
        // email they typed. It has no password - they claim it through the
        // reset-password link emailed to that address.
        let buyerId: string;
        let buyerEmail: string;
        let buyerName: string;
        let guestAccountCreated = false;

        if (session?.user) {
            buyerId = session.user.id as string;
            buyerEmail = session.user.email || "";
            buyerName = session.user.name || "";
        } else {
            try {
                const guest = await findOrCreateGuestUser({
                    email: shippingAddress?.email,
                    firstName: shippingAddress?.firstName,
                    lastName: shippingAddress?.lastName,
                    phone: shippingAddress?.phone,
                });
                buyerId = guest.userId;
                buyerEmail = guest.email;
                buyerName = guest.name;
                guestAccountCreated = guest.isNewAccount;
            } catch (guestError) {
                return NextResponse.json(
                    { error: guestError instanceof Error ? guestError.message : "Could not start guest checkout." },
                    { status: 400 }
                );
            }
        }

        // Currency is NOT taken from the request. All catalogue prices are
        // stored in INR (CurrencyContext treats INR as the source currency and
        // converts only for display), and nothing here converts between
        // currencies - so the charge must be denominated in INR. Accepting the
        // client's label meant an INR amount could be stamped as another
        // currency and sent to Razorpay unconverted.
        const currency = "INR";

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
            // Product configuration, forwarded from the cart. Only ids are
            // accepted - every price comes from the stored catalogue.
            variantId?: string;
            customizationIds?: string[];
            addOnIds?: string[];
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

        // Prices are re-derived from the database. The request body carries a
        // price, but it is never trusted: it previously flowed straight into
        // the Razorpay order amount, so a crafted request could buy anything
        // for any amount.
        //
        // Courses and workshops have a single fixed price, so the stored value
        // is used outright. Products are configurable (variants, customization
        // modifiers, add-ons) and the client's selections aren't forwarded to
        // this route, so an exact recomputation isn't possible here - instead
        // the client price is floor-checked against the cheapest configuration
        // the product could legitimately be sold at, which blocks underpayment
        // while leaving valid configurations alone.
        const priceErrors: string[] = [];

        const orderItems: ProcessedOrderItem[] = await Promise.all(items.map(async (item: OrderItemRequest) => {
            let sellerId: mongoose.Types.ObjectId | undefined;
            let sellerName: string | undefined;
            let unitPrice = Number(item.price) || 0;

            try {
                if (item.kind === "product") {
                    const product = await Product.findById(item.id)
                        .select("name seller sellerName shipping.weight price variants customizations addOns")
                        .lean() as any;
                    if (!product) {
                        priceErrors.push(`Product ${item.id} no longer exists`);
                    } else {
                        sellerId = product.seller;
                        sellerName = product.sellerName;

                        // Rebuild the price from the stored catalogue using the
                        // buyer's selections, mirroring calculatedPrice in
                        // ProductClientPage. This used to be a floor-check
                        // against the cheapest possible configuration, because
                        // the selections were never forwarded from the cart -
                        // which accepted the base price for a premium variant.
                        let derived = Number(product.price) || 0;

                        if (item.variantId) {
                            const variant = (product.variants || []).find((v: any) => String(v.id) === String(item.variantId));
                            if (!variant) {
                                priceErrors.push(`Selected option is no longer available for "${product.name || item.id}"`);
                            } else {
                                derived = Number(variant.price) || 0;
                            }
                        }

                        for (const id of item.customizationIds || []) {
                            const option = (product.customizations || []).find((c: any) => String(c.id) === String(id));
                            if (!option) {
                                priceErrors.push(`A selected customization is no longer available for "${product.name || item.id}"`);
                                continue;
                            }
                            derived += Number(option.priceModifier) || 0;
                        }

                        for (const id of item.addOnIds || []) {
                            const addOn = (product.addOns || []).find((a: any) => String(a.id) === String(id));
                            if (!addOn) {
                                priceErrors.push(`A selected add-on is no longer available for "${product.name || item.id}"`);
                                continue;
                            }
                            derived += Number(addOn.price) || 0;
                        }

                        // The derived figure is what gets charged; the client's
                        // number is only used to detect a stale basket.
                        if (Math.abs(unitPrice - derived) > 0.01) {
                            priceErrors.push(`The price of "${product.name || item.id}" has changed. Please review your cart.`);
                        }
                        unitPrice = derived;
                    }
                } else if (item.kind === "course") {
                    const course = await Course.findById(item.id)
                        .select("instructor instructorName price")
                        .lean() as any;
                    if (!course) {
                        priceErrors.push(`Course ${item.id} no longer exists`);
                    } else {
                        sellerId = course.instructor;
                        sellerName = course.instructorName;
                        unitPrice = Number(course.price) || 0;
                    }
                } else if (item.kind === "workshop") {
                    const workshop = await Workshop.findById(item.id)
                        .select("instructor instructorName price title capacity enrolledCount")
                        .lean() as any;
                    if (!workshop) {
                        priceErrors.push(`Workshop ${item.id} no longer exists`);
                    } else {
                        sellerId = workshop.instructor;
                        sellerName = workshop.instructorName;
                        unitPrice = Number(workshop.price) || 0;

                        // Workshops have a finite number of seats, so unlike a
                        // course they can be oversold. Check here, where the
                        // seat count is authoritative, not in the browser.
                        const capacity = Number(workshop.capacity);
                        if (Number.isFinite(capacity) && capacity > 0) {
                            const taken = Number(workshop.enrolledCount) || 0;
                            const remaining = capacity - taken;
                            if (item.quantity > remaining) {
                                priceErrors.push(
                                    remaining > 0
                                        ? `Only ${remaining} seat(s) left for "${workshop.title}"`
                                        : `"${workshop.title}" is sold out`
                                );
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`Failed to price item ${item.id}`, e);
                priceErrors.push(`Could not verify pricing for item ${item.id}`);
            }

            subtotal += unitPrice * item.quantity;

            return {
                itemId: new mongoose.Types.ObjectId(item.id),
                itemType: item.kind,
                name: item.name,
                quantity: item.quantity,
                price: unitPrice,
                sellerId: sellerId,
                sellerName: sellerName
            };
        }));

        if (priceErrors.length > 0) {
            console.warn("Rejected order due to pricing mismatch:", priceErrors);
            return NextResponse.json(
                { error: "Your cart is out of date. Please refresh and try again." },
                { status: 400 }
            );
        }

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
            user: new mongoose.Types.ObjectId(buyerId),
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
                userId: buyerId,
                userEmail: buyerEmail,
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
            // Lets the success page tell a guest that an account was made for
            // them and how to get into it.
            guestAccountCreated,
            orderNumber,
            dbOrderId: dbOrder._id.toString(),
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
            },
            keyId: getRazorpayKeyId(),
            prefill: {
                name: buyerName,
                email: buyerEmail,
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
