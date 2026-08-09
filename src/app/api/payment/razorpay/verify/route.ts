import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyRazorpayPayment, fetchPaymentDetails } from "@/lib/payment/razorpay";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: "Missing payment verification data" },
                { status: 400 }
            );
        }

        // Verify the payment signature
        const isValid = verifyRazorpayPayment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        // Fetch payment details from Razorpay
        const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);

        await connectDB();

        // Update order status in database
        if (orderId) {
            const order = await Order.findById(orderId);
            if (order) {
                order.paymentStatus = "paid";
                order.paymentMethod = "razorpay";
                order.paymentDetails = {
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    method: paymentDetails.method,
                    amount: Number(paymentDetails.amount),
                    currency: paymentDetails.currency,
                    paidAt: new Date(),
                };
                order.status = "confirmed";
                await order.save();

                // Grant workshop attendance. Course and product ownership is
                // derived from confirmed orders, so nothing extra is needed for
                // those - but /api/user/workshops looks the user up in the
                // Workshop's attendees array, so without this a buyer pays and
                // then finds no booking on their dashboard.
                try {
                    const workshopItems = (order.items || []).filter(
                        (i: any) => i.itemType === "workshop"
                    );
                    if (workshopItems.length > 0) {
                        const Workshop = (await import("@/lib/db/models/Workshop")).default;
                        for (const item of workshopItems) {
                            await Workshop.findByIdAndUpdate(item.itemId, {
                                $addToSet: { attendees: order.user },
                                $inc: { enrolledCount: item.quantity || 1 },
                            });
                        }
                    }
                } catch (err) {
                    // Payment already succeeded - log loudly rather than failing
                    // the request and leaving the buyer thinking it didn't.
                    console.error("Failed to register workshop attendance:", err);
                }

                // Increment Promo Code Usage
                if (order.promoCode) {
                    try {
                        const PromoCode = (await import("@/lib/db/models/PromoCode")).default;
                        await PromoCode.findOneAndUpdate(
                            { code: order.promoCode },
                            { $inc: { usedCount: 1 } }
                        );
                    } catch (err) {
                        console.error("Failed to increment promo usage:", err);
                    }
                }

                // Get User details for email
                try {
                    const User = (await import("@/lib/db/models/User")).default;
                    const dbUser = await User.findById(order.user);
                    if (dbUser) {
                        // Send Order Confirmation Email
                        const { sendOrderConfirmationEmail } = await import("@/lib/email/brevo");
                        await sendOrderConfirmationEmail(order, dbUser.name, dbUser.email);
                        
                        // Send In-App Notification (Buyer)
                        const { createNotification } = await import("@/lib/db/models/Notification");
                        await createNotification({
                            recipientId: dbUser._id,
                            recipientModel: "User",
                            type: "order_placed",
                            title: "Payment Successful",
                            message: `Your payment for order #${order.orderNumber} was successful.`,
                            data: { link: `/user/orders/${order._id}` }
                        });
                        
                        // Send In-App Notifications (Sellers/Studios)
                        // Group by sellerId
                        const sellerIds = new Set(order.items.map((i: any) => i.sellerId?.toString()).filter(Boolean));
                        for (const sellerId of sellerIds) {
                           await createNotification({
                               recipientId: sellerId as unknown as any,
                               recipientModel: "User",
                               type: "order_placed",
                               title: "New Order Received",
                               message: `You have a new order (from #${order.orderNumber}).`,
                               data: { link: `/studio/orders` }
                           });
                        }
                    }
                } catch (err) {
                    console.error("Failed to send order notifications:", err);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified successfully",
            payment: {
                id: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: paymentDetails.amount,
                currency: paymentDetails.currency,
                method: paymentDetails.method,
                status: paymentDetails.status,
            },
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
