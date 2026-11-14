"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { tiun } from "@tiun/sdk";

interface TiunContextValue {
  isReady: boolean;
  user: any | null;
  checkout: (params: { productId: string; referenceId?: string }) => Promise<any>;
  checkProductAccess: (
    productId: string,
    options?: { referenceId?: string }
  ) => Promise<{ hasAccess: boolean; access?: any }>;
  listProductAccess: () => Promise<any[]>;
  listProducts: () => Promise<any[]>;
  getUserVerificationToken: () => Promise<string | null>;
}

const TiunContext = createContext<TiunContextValue>({
  isReady: false,
  user: null,
  checkout: async () => {},
  checkProductAccess: async () => ({ hasAccess: false, access: null }),
  listProductAccess: async () => [],
  listProducts: async () => [],
  getUserVerificationToken: async () => null,
});

export function TiunProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const snippetId = process.env.NEXT_PUBLIC_TIUN_SNIPPET_ID;
    if (!snippetId) {
      // In dev or until snippet ID is configured, leave uninitialized
      return;
    }

    try {
      tiun.init({
        snippetId,
        language: "en",
        appearance: "dark",
      });

      const handleUserChange = (payload: any) => {
        setUser(tiun.user || payload?.user || null);
      };

      const unsubscribe = tiun.on("userChange", handleUserChange);

      tiun.waitForReady().then(() => {
        setIsReady(true);
        setUser(tiun.user || null);
      });

      return () => {
        unsubscribe();
        tiun.destroy();
      };
    } catch (err) {
      console.error("[TiunProvider] Failed to initialize Tiun SDK:", err);
    }
  }, []);

  const value = useMemo<TiunContextValue>(
    () => ({
      isReady,
      user,
      checkout: async (params) => {
        return tiun.checkout(params);
      },
      checkProductAccess: async (productId, options) => {
        return tiun.checkProductAccess(productId, options || {});
      },
      listProductAccess: async () => {
        return tiun.listProductAccess();
      },
      listProducts: async () => {
        return tiun.listProducts();
      },
      getUserVerificationToken: async () => {
        return tiun.getUserVerificationToken();
      },
    }),
    [isReady, user]
  );

  return <TiunContext.Provider value={value}>{children}</TiunContext.Provider>;
}

export function useTiun() {
  return useContext(TiunContext);
}
