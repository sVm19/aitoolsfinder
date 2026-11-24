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

      tiun
        .waitForReady()
        .then(() => {
          setIsReady(true);
          setUser(tiun.user || null);
        })
        .catch((err) => {
          console.warn("[TiunProvider] SDK initialization failed or timed out:", err);
        });

      return () => {
        try {
          unsubscribe();
          tiun.destroy();
        } catch {
          // ignore cleanup errors
        }
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
        try {
          return await tiun.checkout(params);
        } catch (err) {
          console.warn("[TiunProvider] checkout error:", err);
          return null;
        }
      },
      checkProductAccess: async (productId, options) => {
        try {
          return await tiun.checkProductAccess(productId, options || {});
        } catch (err) {
          console.warn("[TiunProvider] checkProductAccess error:", err);
          return { hasAccess: false, access: null };
        }
      },
      listProductAccess: async () => {
        try {
          return await tiun.listProductAccess();
        } catch (err) {
          console.warn("[TiunProvider] listProductAccess error:", err);
          return [];
        }
      },
      listProducts: async () => {
        try {
          return await tiun.listProducts();
        } catch (err) {
          console.warn("[TiunProvider] listProducts error:", err);
          return [];
        }
      },
      getUserVerificationToken: async () => {
        try {
          return await tiun.getUserVerificationToken();
        } catch (err) {
          console.warn("[TiunProvider] getUserVerificationToken error:", err);
          return null;
        }
      },
    }),
    [isReady, user]
  );

  return <TiunContext.Provider value={value}>{children}</TiunContext.Provider>;
}

export function useTiun() {
  return useContext(TiunContext);
}
