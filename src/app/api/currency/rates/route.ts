
import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
    try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
            next: { revalidate: 86400 }
        });

        if (!res.ok) {
            throw new Error("Failed to fetch rates");
        }

        const data = await res.json();

        // Return only the rates we need to minimize packet size
        const rates = {
            USD: data.rates.USD || 1,
            INR: data.rates.INR,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP
        };

        return NextResponse.json({ rates });
    } catch (error) {
        console.error("Currency API Error:", error);
        return NextResponse.json(
            { message: "Failed to fetch currency rates" },
            { status: 500 }
        );
    }
}
