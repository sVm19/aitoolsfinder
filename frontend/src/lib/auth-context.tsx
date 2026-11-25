"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: "cognito_otp";
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendMagicCode: (email: string) => Promise<{
    success: boolean;
    message?: string;
    destination?: string;
    error?: string;
  }>;
  sendMagicLink: (email: string) => Promise<{
    success: boolean;
    message?: string;
    destination?: string;
    error?: string;
  }>;
  verifyMagicCode: (
    email: string,
    code: string
  ) => Promise<{
    success: boolean;
    hasFounderProfile?: boolean;
    error?: string;
  }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "aitoolsfinder_token";
const USER_KEY = "aitoolsfinder_user";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Storage error or SSR
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = useCallback((authToken: string, authUser: AuthUser) => {
    setToken(authToken);
    setUser(authUser);

    try {
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      document.cookie = `${TOKEN_KEY}=${authToken}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    } catch {
      // ignore
    }
  }, []);

  const sendMagicCode = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return { success: false, error: "Please enter a valid email address." };
      }

      const res = await fetch(`${API_BASE}/auth/magic-code/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error:
            data.detail ||
            data.error?.message ||
            "Unable to send verification code. Please check your email.",
        };
      }

      return {
        success: true,
        message: data.message,
        destination: data.destination,
      };
    } catch {
      return {
        success: false,
        error: "Unable to reach server. Please ensure the backend is running.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMagicCode = useCallback(
    async (email: string, code: string) => {
      setIsLoading(true);
      try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim();

        const res = await fetch(`${API_BASE}/auth/magic-code/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            success: false,
            error:
              data.detail ||
              data.error?.message ||
              "Invalid code. Please try again.",
          };
        }

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.display_name || cleanEmail.split("@")[0],
          avatar: `https://unavatar.io/${encodeURIComponent(cleanEmail)}`,
          provider: "cognito_otp",
          createdAt: data.user.created_at,
        };

        saveSession(data.token, authUser);
        return {
          success: true,
          hasFounderProfile: data.has_founder_profile,
        };
      } catch {
        return {
          success: false,
          error: "Verification failed. Please try again.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [saveSession]
  );

  const signOut = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        sendMagicCode,
        sendMagicLink: sendMagicCode,
        verifyMagicCode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
