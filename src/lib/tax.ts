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

/** Used when a product carries no rate of its own. */
export const DEFAULT_GST_RATE = 18;
export const DEFAULT_TAX_COUNTRY = "IN";

/** The slabs a seller may choose from for a physical product. */
export const PRODUCT_GST_SLABS = [5, 12, 18] as const;
export type ProductGstSlab = (typeof PRODUCT_GST_SLABS)[number];

/**
 * Online courses and workshops are supplied electronically and are taxed at the
 * 18% standard rate, so unlike physical goods the seller does not choose. Kept
 * as a named constant so the reason travels with the number.
 */
export const DIGITAL_SERVICE_GST_RATE = 18;

/** The GST rate that applies to a single line item. */
export function rateForItem(itemType: string | undefined, productTaxRate?: number | null): number {
    if (itemType === "course" || itemType === "workshop") return DIGITAL_SERVICE_GST_RATE;
    const rate = Number(productTaxRate);
    return PRODUCT_GST_SLABS.includes(rate as ProductGstSlab) ? rate : DEFAULT_GST_RATE;
}

/** Sums GST across a basket where each line may sit in a different slab. */
export function taxForItems(
    items: { price: number; quantity: number; itemType?: string; taxRate?: number | null }[]
): { amount: number; rates: number[] } {
    let amount = 0;
    const rates = new Set<number>();
    for (const item of items) {
        const rate = rateForItem(item.itemType, item.taxRate);
        rates.add(rate);
        amount += (Number(item.price) || 0) * (Number(item.quantity) || 0) * (rate / 100);
    }
    return { amount: Math.round(amount * 100) / 100, rates: [...rates].sort((a, b) => a - b) };
}

/** "GST (18%)" for one rate, "GST" when a basket mixes slabs. */
export function taxLabelForRates(rates: number[], displayName = "GST"): string {
    if (rates.length === 1) return `${displayName} (${rates[0]}%)`;
    return displayName;
}

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
