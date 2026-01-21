import Razorpay from "razorpay";

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export interface CreateOrderParams {
    amount: number; // Amount in paise (e.g., 10000 = ₹100)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    notes: Record<string, string>;
    created_at: number;
}

export interface VerifyPaymentParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

/**
 * Create a new Razorpay order
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrder> {
    const order = await razorpay.orders.create({
        amount: params.amount,
        currency: params.currency || "INR",
        receipt: params.receipt,
        notes: params.notes || {},
    });

    return order as RazorpayOrder;
}

/**
 * Verify Razorpay payment signature
 */
export function verifyRazorpayPayment(params: VerifyPaymentParams): boolean {
    const crypto = require("crypto");

    const body = params.razorpay_order_id + "|" + params.razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(body)
        .digest("hex");

    return expectedSignature === params.razorpay_signature;
}

/**
 * Fetch payment details
 */
export async function fetchPaymentDetails(paymentId: string) {
    return await razorpay.payments.fetch(paymentId);
}

/**
 * Initiate refund
 */
export async function initiateRefund(paymentId: string, amount?: number) {
    const refundOptions: { payment_id: string; amount?: number } = {
        payment_id: paymentId,
    };

    if (amount) {
        refundOptions.amount = amount; // Amount in paise
    }

    return await razorpay.payments.refund(paymentId, refundOptions);
}

/**
 * Get Razorpay public key for frontend
 */
export function getRazorpayKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || "";
}
