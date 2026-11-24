"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useStack } from "@/components/stack/stack-provider";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Mail, CheckCircle2, ArrowRight, ShieldCheck, Laptop, Lock } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authReason } = useStack();
  const { user, isAuthenticated, sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [isSignedInSuccess, setIsSignedInSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await sendMagicLink(email);
      if (!result.success) {
        setErrorMessage(result.error || "Unable to send magic link.");
        return;
      }
      setIsSignedInSuccess(true);
    } catch {
      setErrorMessage("Unable to send magic link right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        aria-label="Cloud Sync & Early Access"
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

        {/* Contextual Header */}
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Cloud Sync Early Access
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {authReason || "Save your AI Stack across devices, track price changes, and get maker updates."}
        </p>

        {/* Live Local Sync Reassurance */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-400">
          <Laptop className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>
            <strong className="font-semibold text-foreground">Local stack active:</strong> Saved tools are already preserved in this browser.
          </span>
        </div>

        {/* Authentication State / Form */}
        {isSignedInSuccess || isAuthenticated ? (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Signed In Successfully!</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Your session is active as <span className="font-semibold text-foreground">{user?.email || email}</span>. Your stack and preferences are now saved.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={closeAuthModal}
              className="mt-4 w-full justify-center"
            >
              Continue Exploring Tools
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-xl border border-border bg-surface-1 pl-9 pr-3 text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary/70 placeholder:text-subtle-foreground"
                />
              </div>

              {errorMessage ? (
                <p className="text-xs text-rose-400">{errorMessage}</p>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full justify-center shadow-lavender-glow"
              >
                {isLoading ? "Sending Magic Link..." : "Send Magic Link"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              <Link
                href="/login"
                onClick={closeAuthModal}
                className="text-primary-content hover:underline font-medium"
              >
                Open Full Magic Link Login Page →
              </Link>
            </div>
          </div>
        )}

        {/* Honest Trust Reassurance */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-subtle-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary-content shrink-0" />
          <span>Zero spam. No account required to use the catalog or compare tools today.</span>
        </div>
      </div>
    </div>
  );
}
