// Shared types for the Razorpay web checkout SDK, which is loaded from their
// CDN at runtime and so has no types of its own.
//
// These previously lived inside src/app/checkout/page.tsx and were published
// globally from there via `declare global`, which meant any other page opening
// a Razorpay modal either silently depended on a page component or had to
// redeclare - and a redeclaration that drifted became a type error. One
// definition here, used by every checkout page.

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayPaymentResponse) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    /** Called when the customer closes the modal without paying. */
    modal?: {
        ondismiss?: () => void;
    };
    notes?: Record<string, string>;
}

interface RazorpayPaymentResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface Razorpay {
    new(options: RazorpayOptions): {
        open: () => void;
    };
}

interface Window {
    Razorpay: Razorpay;
}
