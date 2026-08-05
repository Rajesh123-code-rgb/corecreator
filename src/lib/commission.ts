/**
 * Single source of truth for creator commission rates.
 * Update here only - every page (/pricing, homepage, studio/register, faqs, help)
 * reads from this so the site can never show conflicting numbers again.
 */

export const COMMISSION = {
    standardRatePct: 15,
    promoRatePct: 10,
    /** IST (UTC+5:30) end of day, Dec 31 2026 */
    promoEndsAt: new Date("2026-12-31T23:59:59+05:30"),
} as const;

export function isPromoActive(asOf: Date = new Date()): boolean {
    return asOf.getTime() <= COMMISSION.promoEndsAt.getTime();
}

export function getCurrentCommissionPct(asOf: Date = new Date()): number {
    return isPromoActive(asOf) ? COMMISSION.promoRatePct : COMMISSION.standardRatePct;
}

export function getCurrentCreatorSharePct(asOf: Date = new Date()): number {
    return 100 - getCurrentCommissionPct(asOf);
}

const PROMO_END_LABEL = COMMISSION.promoEndsAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
});

/** Short line for tight UI spots (hero bullets, cards). */
export function commissionHeadline(asOf: Date = new Date()): string {
    if (isPromoActive(asOf)) {
        return `Keep ${getCurrentCreatorSharePct(asOf)}% through ${PROMO_END_LABEL} — ${100 - COMMISSION.standardRatePct}% standard rate after`;
    }
    return `Creators keep ${100 - COMMISSION.standardRatePct}% of their earnings`;
}

/** Full sentence for FAQ/Help style copy. */
export function commissionFaqAnswer(asOf: Date = new Date()): string {
    if (isPromoActive(asOf)) {
        return `Our standard commission is ${COMMISSION.standardRatePct}% per sale. As a limited-time launch offer, it's reduced to ${COMMISSION.promoRatePct}% for all sales through ${PROMO_END_LABEL}. There are no monthly subscription fees or listing fees.`;
    }
    return `We take a flat ${COMMISSION.standardRatePct}% commission on sales to cover payment processing and platform maintenance. There are no monthly subscription fees.`;
}
