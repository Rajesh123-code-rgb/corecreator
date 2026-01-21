"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "USD" | "INR" | "EUR" | "GBP";

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (curr: Currency) => void;
    formatPrice: (amount: number, sourceCurrency?: Currency, options?: Intl.NumberFormatOptions) => string;
}

// Default/Fallback config
const defaultRates = {
    USD: 1,
    INR: 83.5,
    EUR: 0.92,
    GBP: 0.79
};

const currencyConfig: Record<Currency, { symbol: string; locale: string }> = {
    USD: { symbol: "$", locale: "en-US" },
    INR: { symbol: "₹", locale: "en-IN" },
    EUR: { symbol: "€", locale: "de-DE" },
    GBP: { symbol: "£", locale: "en-GB" },
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>("INR");
    const [rates, setRates] = useState<Record<Currency, number>>(defaultRates);

    // Fetch live rates on mount
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch("/api/currency/rates");
                if (res.ok) {
                    const data = await res.json();
                    if (data.rates) {
                        setRates(prev => ({ ...prev, ...data.rates }));
                    }
                }
            } catch (error) {
                console.error("Failed to load currency rates:", error);
            }
        };

        fetchRates();
    }, []);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCurr = localStorage.getItem("app-currency") as Currency;
        if (savedCurr && currencyConfig[savedCurr]) {
            setCurrency(savedCurr);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem("app-currency", currency);
    }, [currency]);

    /**
     * Format and convert price from source currency to user's selected currency
     * @param amount - The price amount
     * @param sourceCurrency - The currency the price is stored in (defaults to product's currency, typically INR)
     * @param options - Additional Intl.NumberFormatOptions
     */
    const formatPrice = (
        amount: number,
        sourceCurrency: Currency = "INR",
        options?: Intl.NumberFormatOptions
    ) => {
        const config = currencyConfig[currency];

        // If source and target currency are the same, no conversion needed
        if (sourceCurrency === currency) {
            return new Intl.NumberFormat(config.locale, {
                style: "currency",
                currency: currency,
                ...options
            }).format(amount);
        }

        // Convert: source → USD → target
        const sourceRate = rates[sourceCurrency];
        const targetRate = rates[currency];
        const amountInUSD = amount / sourceRate; // Convert to USD first
        const convertedAmount = amountInUSD * targetRate; // Then to target currency

        return new Intl.NumberFormat(config.locale, {
            style: "currency",
            currency: currency,
            ...options
        }).format(convertedAmount);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
