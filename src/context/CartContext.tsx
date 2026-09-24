"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartBook {
  bookId: string;
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  coverImage: string;
  price: number;
  salePrice?: number | null;
}

export interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

interface CartContextType {
  items: CartBook[];
  addItem: (book: CartBook) => void;
  removeItem: (bookId: string) => void;
  clearCart: () => void;
  isInCart: (bookId: string) => boolean;
  coupon: AppliedCoupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "noveraile_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartBook[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isLoaded]);

  const addItem = React.useCallback((book: CartBook) => {
    setItems((prev) => {
      if (prev.some((item) => item.bookId === book.bookId)) {
        return prev; // Digital book already in cart
      }
      return [...prev, book];
    });
  }, []);

  const removeItem = React.useCallback((bookId: string) => {
    setItems((prev) => prev.filter((item) => item.bookId !== bookId));
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const isInCart = React.useCallback((bookId: string) => {
    return items.some((item) => item.bookId === bookId);
  }, [items]);

  const subtotal = items.reduce((sum, item) => {
    const activePrice = item.salePrice != null && item.salePrice > 0 ? item.salePrice : item.price;
    return sum + activePrice;
  }, 0);

  let discountAmount = 0;
  if (coupon) {
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    if (!code.trim()) return false;

    try {
      const res = await fetch("/api/cart/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || "Invalid coupon code.");
        return false;
      }

      setCoupon({
        code: data.coupon.code,
        discountType: data.coupon.discountType,
        discountValue: data.coupon.discountValue,
      });
      return true;
    } catch {
      setCouponError("Unable to validate coupon at this time.");
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        coupon,
        couponError,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        total,
        itemCount: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
