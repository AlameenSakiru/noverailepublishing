"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { StorefrontData, CURRENCY_MAP } from "@/lib/settings";

interface StorefrontContextType extends StorefrontData {
  formatPrice: (amount: number) => string;
  updateStorefront: (updates: Partial<StorefrontData>) => void;
}

const defaultStorefront: StorefrontData = {
  siteName: "Noveraile Publishing",
  siteTagline: "Books built for where you're going next.",
  siteSubTagline: "Authoritative publications across professional certification prep, literature, travel, and strategic leadership. Read instantly in your browser on any device — zero apps or downloads required.",
  contactEmail: "noverailepublishing@gmail.com",
  currency: "USD",
  currencySymbol: "$",
  announcementBanner: "",
  announcementEnabled: false,
  logoStyle: "IMAGE",
  usdToNgnRate: 1600,
};

const StorefrontContext = createContext<StorefrontContextType>({
  ...defaultStorefront,
  formatPrice: (amount: number) => (amount <= 0.001 ? "FREE" : `$${amount.toFixed(2)}`),
  updateStorefront: () => {},
});

export function StorefrontProvider({
  initialSettings,
  children,
}: {
  initialSettings?: Partial<StorefrontData>;
  children: React.ReactNode;
}) {
  const [storefront, setStorefront] = useState<StorefrontData>({
    ...defaultStorefront,
    ...(initialSettings || {}),
  });

  const updateStorefront = (updates: Partial<StorefrontData>) => {
    setStorefront((prev) => {
      const updated = { ...prev, ...updates };
      if (updates.currency && !updates.currencySymbol) {
        updated.currencySymbol = CURRENCY_MAP[updates.currency.toUpperCase()]?.symbol || "$";
      }
      return updated;
    });
  };

  const formatPrice = useMemo(() => {
    const symbol = storefront.currencySymbol || "$";
    const curr = storefront.currency || "USD";

    return (amount: number) => {
      if (amount <= 0.001) return "FREE";
      if (curr === "NGN") {
        return `${symbol}${amount.toLocaleString("en-NG", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`;
      }
      return `${symbol}${amount.toFixed(2)}`;
    };
  }, [storefront.currency, storefront.currencySymbol]);

  const value = useMemo(
    () => ({
      ...storefront,
      formatPrice,
      updateStorefront,
    }),
    [storefront, formatPrice]
  );

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront(): StorefrontContextType {
  const context = useContext(StorefrontContext);
  return context;
}
