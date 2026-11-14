"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStack } from "@/components/stack/stack-provider";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Mail, Check, ArrowRight } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authReason } = useStack();
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleMagicLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Simulate sending magic link (backend hook ready)
    setTimeout(() => {
      setIsLoading(false);
      setMagicLinkSent(true);
    }, 600);
  };

  const handleOAuthLogin = (provider: "google" | "github") => {
    // In production, redirects to /api/v1/auth/{provider}
    // For now, redirect or close gracefully
    window.location.href = `/login?provider=${provider}&redirect=${encodeURIComponent(
      window.location.pathname
    )}`;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to AIToolsFinder"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-background/98 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Brand & Icon */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white shadow-lavender-glow">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            AIToolsFinder<span className="text-accent">.</span>
          </span>
        </div>

        {/* Dynamic Contextual Header */}
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Welcome to AIToolsFinder
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {authReason || "Save your AI Stack across devices, vote on daily drops, and track price changes."}
        </p>

        {/* 1-Click OAuth Providers */}
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-1/90 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-surface-2 active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-1/90 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-surface-2 active:scale-95"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-subtle-foreground font-mono">
              Or passwordless email
            </span>
          </div>
        </div>

        {/* Passwordless Magic Link Form */}
        {magicLinkSent ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-content mb-2">
              <Check className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Login link sent!</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              We sent a temporary sign-in link to <span className="font-semibold text-foreground">{email}</span>. Click it to log in instantly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11 w-full rounded-xl border border-border bg-surface-1 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/70 placeholder:text-subtle-foreground"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full justify-center shadow-lavender-glow"
            >
              {isLoading ? "Sending..." : "Send Magic Link"}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>
        )}

        {/* Security / Free Reassurance */}
        <p className="mt-5 text-center text-[11px] text-subtle-foreground">
          By signing in, you agree to our Terms and Privacy Policy. 100% Free forever.
        </p>
      </div>
    </div>
  );
}
