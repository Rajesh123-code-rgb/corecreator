/**
 * Shared, dependency-free tax helpers. Safe to import from client components -
 * the database lookup lives in tax.server.ts so this file never pulls mongoose
 * into the browser bundle.
 *
 * Before this, the rate was a magic number written into four separate files:
 * 8% in the cart, the checkout page and create-order, and 18% on workshop
 * checkout under a comment reading "18% GST example". 8% corresponds to no
 * Indian GST band (they are 0/5/12/18/28), so customers were billed an amount
 * that reconciled to no real rate - and products and workshops disagreed.
 */

/** Used when the admin has not configured a rate for the country. */
export const DEFAULT_GST_RATE = 18;
export const DEFAULT_TAX_COUNTRY = "IN";

export interface AppliedTax {
    /** Percentage, e.g. 18 for 18%. */
    rate: number;
    /** What to call it in the UI, e.g. "GST (18%)". */
    label: string;
    /** Tax due on the given amount, rounded to 2dp. */
    amount: number;
}

/** Formats the rate for display. */
export function formatTaxLabel(rate: number, displayName = "GST"): string {
    return `${displayName} (${rate}%)`;
}

/**
 * Applies a rate to an amount. Shared by the cart, checkout and create-order so
 * the figure shown and the figure charged cannot drift apart.
 */
export function applyTax(amount: number, rate: number, displayName = "GST"): AppliedTax {
    const taxAmount = Math.round(amount * (rate / 100) * 100) / 100;
    return { rate, label: formatTaxLabel(rate, displayName), amount: taxAmount };
}
