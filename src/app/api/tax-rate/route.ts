import { NextResponse } from "next/server";
import { getTaxRate } from "@/lib/tax.server";

// Lets the cart and checkout display the same rate the server will charge,
// rather than each hardcoding their own guess. Cached briefly - the rate
// changes about as often as tax law does.
export const revalidate = 300;

export async function GET() {
    const { rate, displayName } = await getTaxRate();
    return NextResponse.json({ rate, displayName });
}
