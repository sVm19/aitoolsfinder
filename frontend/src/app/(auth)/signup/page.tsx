"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/common/brand-logo";
import { Sparkles, Mail, Check, ArrowRight, Layers, Bell, Shield } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMagicLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMagicLinkSent(true);
    }, 600);
  };

  const handleOAuthLogin = (provider: "google" | "github") => {
    window.location.href = `/api/v1/auth/${provider}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="aurora-blob aurora-blob-a opacity-25" />
        <div className="aurora-blob aurora-blob-b opacity-15" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Link */}
        <div className="text-center">
          <BrandLogo size="lg" className="justify-center" />

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join 12,000+ engineers and builders evaluating verified AI tools.
          </p>
        </div>

        {/* Card Box */}
        <div className="rounded-2xl border border-white/10 bg-surface-1/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
          {/* OAuth Providers */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-2/70 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-surface-3 active:scale-95"
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
              <span>Sign up with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin("github")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-2/70 px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-surface-3 active:scale-95"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Sign up with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-1 px-2 text-subtle-foreground font-mono">
                Or passwordless magic link
              </span>
            </div>
          </div>

          {/* Passwordless Magic Link Form */}
          {magicLinkSent ? (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary-content mb-2">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Account link sent!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Check <span className="font-semibold text-foreground">{email}</span> for your instant confirmation link.
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
                  className="h-11 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/70 placeholder:text-subtle-foreground"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full justify-center shadow-lavender-glow"
              >
                {isLoading ? "Creating..." : "Create Free Account"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          )}

          {/* Member Benefits */}
          <div className="mt-6 pt-6 border-t border-border/70 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-primary-content shrink-0" />
              <span>Unlimited saved tools in My AI Stack</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-accent shrink-0" />
              <span>Instant alerts when shortlisted tools drop prices</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary-content shrink-0" />
              <span>Vote on daily drops & maker rankings</span>
            </div>
          </div>
        </div>

        {/* Footer switch */}
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-content hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
