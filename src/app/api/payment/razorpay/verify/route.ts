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
