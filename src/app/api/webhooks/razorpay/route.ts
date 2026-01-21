import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db/mongodb";
import Order from "@/lib/db/models/Order";

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("Invalid webhook signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        const eventType = event.event;

        await connectDB();

        switch (eventType) {
            case "payment.captured":
                await handlePaymentCaptured(event.payload.payment.entity);
                break;

            case "payment.failed":
                await handlePaymentFailed(event.payload.payment.entity);
                break;

            case "refund.processed":
                await handleRefundProcessed(event.payload.refund.entity);
                break;

            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}

async function handlePaymentCaptured(payment: {
    order_id: string;
    id: string;
    amount: number;
    currency: string;
    method: string;
}) {
    const order = await Order.findOne({
        "paymentDetails.razorpayOrderId": payment.order_id,
    });

    if (order) {
        order.paymentStatus = "paid";
        order.status = "confirmed";
        order.paymentDetails = {
            ...order.paymentDetails,
            razorpayPaymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            paidAt: new Date(),
        };
        await order.save();
        console.log(`Order ${order._id} marked as paid`);
    }
}

async function handlePaymentFailed(payment: {
    order_id: string;
    id: string;
    error_description: string;
}) {
    const order = await Order.findOne({
        "paymentDetails.razorpayOrderId": payment.order_id,
    });

    if (order) {
        order.paymentStatus = "failed";
        order.paymentDetails = {
            ...order.paymentDetails,
            razorpayPaymentId: payment.id,
            failureReason: payment.error_description,
        };
        await order.save();
        console.log(`Order ${order._id} payment failed`);
    }
}

async function handleRefundProcessed(refund: {
    payment_id: string;
    amount: number;
    status: string;
}) {
    const order = await Order.findOne({
        "paymentDetails.razorpayPaymentId": refund.payment_id,
    });

    if (order) {
        order.paymentStatus = refund.amount === order.total * 100 ? "refunded" : "partially_refunded";
        order.refundDetails = {
            amount: refund.amount,
            status: refund.status,
            processedAt: new Date(),
        };
        await order.save();
        console.log(`Order ${order._id} refund processed`);
    }
}
