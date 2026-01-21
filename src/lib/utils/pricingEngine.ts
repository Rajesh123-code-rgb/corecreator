/**
 * Pricing Engine for CoreCreator Platform
 * Handles commission calculation, price formatting, and seller payouts
 */

export interface PricingConfig {
    platformCommission: number; // Percentage (0-100)
    paymentProcessingFee: number; // Percentage (0-100)
    minimumPayout: number; // Minimum amount for payout in USD
    taxConfig?: {
        includeTax: boolean;
        taxRate: number;
    };
}

export interface PriceBreakdown {
    basePrice: number;
    variantModifier: number;
    customizationFees: number;
    addOnsFees: number;
    subtotal: number;
    platformFee: number;
    processingFee: number;
    tax: number;
    totalBuyerPays: number;
    sellerReceives: number;
}

// Default platform configuration
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
    platformCommission: 12, // 12% platform commission
    paymentProcessingFee: 2.9, // ~2.9% for payment processing + taxes
    minimumPayout: 500, // Minimum ₹500 for payout
    taxConfig: {
        includeTax: false,
        taxRate: 18 // GST
    }
};

/**
 * Calculate complete price breakdown for a product purchase
 */
export function calculatePriceBreakdown(
    basePrice: number,
    options: {
        variantPrice?: number;
        customizationModifiers?: number[];
        addOnPrices?: number[];
        quantity?: number;
        config?: Partial<PricingConfig>;
    } = {}
): PriceBreakdown {
    const config = { ...DEFAULT_PRICING_CONFIG, ...options.config };
    const quantity = options.quantity || 1;

    // Calculate base components
    const variantModifier = options.variantPrice ? (options.variantPrice - basePrice) : 0;
    const effectiveUnitPrice = options.variantPrice || basePrice;

    const customizationFees = (options.customizationModifiers || []).reduce((sum, m) => sum + m, 0);
    const addOnsFees = (options.addOnPrices || []).reduce((sum, p) => sum + p, 0);

    // Subtotal before fees
    const unitSubtotal = effectiveUnitPrice + customizationFees + addOnsFees;
    const subtotal = unitSubtotal * quantity;

    // Calculate fees
    const platformFee = subtotal * (config.platformCommission / 100);
    const processingFee = subtotal * (config.paymentProcessingFee / 100);

    // Tax (if applicable)
    const tax = config.taxConfig?.includeTax
        ? subtotal * (config.taxConfig.taxRate / 100)
        : 0;

    // Final amounts
    const totalBuyerPays = subtotal + tax;
    const sellerReceives = subtotal - platformFee - processingFee;

    return {
        basePrice,
        variantModifier,
        customizationFees,
        addOnsFees,
        subtotal,
        platformFee: Math.round(platformFee * 100) / 100,
        processingFee: Math.round(processingFee * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        totalBuyerPays: Math.round(totalBuyerPays * 100) / 100,
        sellerReceives: Math.round(sellerReceives * 100) / 100
    };
}

/**
 * Calculate seller earnings summary for a list of orders
 */
export function calculateSellerEarnings(
    orders: { subtotal: number; platformFee: number; processingFee: number }[]
): {
    totalSales: number;
    totalFees: number;
    netEarnings: number;
    pendingPayout: number;
    canRequestPayout: boolean;
} {
    const config = DEFAULT_PRICING_CONFIG;

    const totalSales = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalFees = orders.reduce((sum, o) => sum + o.platformFee + o.processingFee, 0);
    const netEarnings = totalSales - totalFees;

    // For simplicity, assume all earnings are pending
    const pendingPayout = netEarnings;
    const canRequestPayout = pendingPayout >= config.minimumPayout;

    return {
        totalSales: Math.round(totalSales * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        netEarnings: Math.round(netEarnings * 100) / 100,
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        canRequestPayout
    };
}

/**
 * Format price for display with currency symbol
 */
export function formatPriceDisplay(
    amount: number,
    currency: string = "INR",
    locale: string = "en-IN"
): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency
    }).format(amount);
}

/**
 * Check if a product has low stock
 */
export function isLowStock(
    quantity: number,
    threshold: number = 5
): boolean {
    return quantity > 0 && quantity <= threshold;
}

/**
 * Check if a product is out of stock
 */
export function isOutOfStock(quantity: number): boolean {
    return quantity <= 0;
}

/**
 * Get stock status label and color
 */
export function getStockStatus(
    quantity: number,
    threshold: number = 5
): { label: string; color: "green" | "yellow" | "red" } {
    if (isOutOfStock(quantity)) {
        return { label: "Out of Stock", color: "red" };
    }
    if (isLowStock(quantity, threshold)) {
        return { label: `Low Stock (${quantity})`, color: "yellow" };
    }
    return { label: "In Stock", color: "green" };
}

/**
 * Calculate total inventory value
 */
export function calculateInventoryValue(
    products: { price: number; quantity: number; variants?: { price: number; stock: number }[] }[]
): number {
    return products.reduce((total, product) => {
        if (product.variants && product.variants.length > 0) {
            // Sum variant inventory values
            return total + product.variants.reduce((sum, v) => sum + (v.price * v.stock), 0);
        }
        // No variants - use product price * quantity
        return total + (product.price * product.quantity);
    }, 0);
}
