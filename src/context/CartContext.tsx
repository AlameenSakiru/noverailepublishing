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

export interface GiftDetails {
  isGift: boolean;
  recipientName: string;
  recipientEmail: string;
  giftMessage: string;
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
  // Gift State
  isGift: boolean;
  recipientName: string;
  recipientEmail: string;
  giftMessage: string;
  setIsGift: (isGift: boolean) => void;
  setRecipientName: (name: string) => void;
  setRecipientEmail: (email: string) => void;
  setGiftMessage: (msg: string) => void;
  setGiftDetails: (details: Partial<GiftDetails>) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "noveraile_cart_v1";
const GIFT_STORAGE_KEY = "noveraile_cart_gift_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartBook[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Gift state
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  // Load cart & gift details from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedGift = localStorage.getItem(GIFT_STORAGE_KEY);
      if (storedGift) {
        const parsedGift = JSON.parse(storedGift);
        if (parsedGift.isGift !== undefined) setIsGift(Boolean(parsedGift.isGift));
        if (parsedGift.recipientName) setRecipientName(parsedGift.recipientName);
        if (parsedGift.recipientEmail) setRecipientEmail(parsedGift.recipientEmail);
        if (parsedGift.giftMessage) setGiftMessage(parsedGift.giftMessage);
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

  // Save gift settings to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        GIFT_STORAGE_KEY,
        JSON.stringify({
          isGift,
          recipientName,
          recipientEmail,
          giftMessage,
        })
      );
    } catch {
      // ignore
    }
  }, [isGift, recipientName, recipientEmail, giftMessage, isLoaded]);

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
    setIsGift(false);
    setRecipientName("");
    setRecipientEmail("");
    setGiftMessage("");
    try {
      localStorage.removeItem(GIFT_STORAGE_KEY);
    } catch {}
  }, []);

  const setGiftDetails = React.useCallback((details: Partial<GiftDetails>) => {
    if (details.isGift !== undefined) setIsGift(details.isGift);
    if (details.recipientName !== undefined) setRecipientName(details.recipientName);
    if (details.recipientEmail !== undefined) setRecipientEmail(details.recipientEmail);
    if (details.giftMessage !== undefined) setGiftMessage(details.giftMessage);
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
        isGift,
        recipientName,
        recipientEmail,
        giftMessage,
        setIsGift,
        setRecipientName,
        setRecipientEmail,
        setGiftMessage,
        setGiftDetails,
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
