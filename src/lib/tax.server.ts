import connectDB from "@/lib/db/mongodb";
import TaxRate from "@/lib/db/models/TaxRate";
import { DEFAULT_GST_RATE, DEFAULT_TAX_COUNTRY } from "@/lib/tax";

/**
 * Resolves the active tax rate for a country from the admin-configured
 * TaxRate collection, falling back to the default when none is set.
 *
 * The TaxRate model and its admin endpoints already existed; nothing in the
 * purchase path ever consulted them. This is that missing link.
 */
export async function getTaxRate(
    country: string = DEFAULT_TAX_COUNTRY
): Promise<{ rate: number; displayName: string }> {
    try {
        await connectDB();
        const configured = (await TaxRate.findOne({
            country: country.toUpperCase(),
            isActive: true,
        })
            .sort({ priority: -1 })
            .lean()) as any;

        if (configured && Number.isFinite(Number(configured.rate))) {
            return {
                rate: Number(configured.rate),
                displayName: configured.displayName || configured.name || "GST",
            };
        }
    } catch (error) {
        // Never fail an order over a tax lookup - fall back to the default and
        // make the failure visible in the logs.
        console.error("Tax rate lookup failed, using default:", error);
    }
    return { rate: DEFAULT_GST_RATE, displayName: "GST" };
}
