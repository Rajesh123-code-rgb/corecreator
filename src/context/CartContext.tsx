"use client";

import * as React from "react";

interface CartItem {
    id: string;
    type: "product" | "course" | "workshop";
    name: string;
    price: number;
    quantity: number;
    image: string;
    seller?: string;
    instructor?: string;
    // Shipping fields (only for physical products)
    shippingPrice?: number;
    isFreeShipping?: boolean;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    applyPromo: (code: string, discount: number) => void;
    removePromo: () => void;
    itemCount: number;
    subtotal: number;
    shippingTotal: number; // Calculated from product shipping prices
    discount: number;
    promoCode: string | null;
    total: number;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = React.useState<CartItem[]>([]);
    const [promoCode, setPromoCode] = React.useState<string | null>(null);
    const [discount, setDiscount] = React.useState(0);

    // Load cart from localStorage on mount
    React.useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch {
                localStorage.removeItem("cart");
            }
        }
    }, []);

    // Save cart to localStorage when it changes
    React.useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(items));
        // Reset promo if cart becomes empty
        if (items.length === 0) {
            setPromoCode(null);
            setDiscount(0);
        }
    }, [items]);

    const addItem = (newItem: CartItem) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === newItem.id);
            if (existing) {
                if (newItem.type === "course") return prev;
                return prev.map((item) =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + newItem.quantity }
                        : item
                );
            }
            return [...prev, newItem];
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(id);
            return;
        }
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => {
        setItems([]);
        setPromoCode(null);
        setDiscount(0);
    };

    const applyPromo = (code: string, amount: number) => {
        setPromoCode(code);
        setDiscount(amount);
    };

    const removePromo = () => {
        setPromoCode(null);
        setDiscount(0);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate shipping: 0 for courses/workshops, use shippingPrice for products
    const shippingTotal = items.reduce((sum, item) => {
        // Courses and workshops are digital - no shipping
        if (item.type === "course" || item.type === "workshop") return sum;
        // Free shipping products
        if (item.isFreeShipping) return sum;
        // Add shipping price per quantity
        return sum + (item.shippingPrice || 0) * item.quantity;
    }, 0);

    const total = Math.max(0, subtotal + shippingTotal - discount);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                applyPromo,
                removePromo,
                itemCount,
                subtotal,
                shippingTotal,
                discount,
                promoCode,
                total
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = React.useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
