"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BrandLogo } from "@/components/common/brand-logo";
import { X, Check, CheckCircle2, KeyRound, LogOut, Mail, RotateCw, ArrowLeft } from "lucide-react";

interface AuthCardProps {
  redirectUrl?: string;
}

export function AuthCard({ redirectUrl = "/" }: AuthCardProps) {
  const router = useRouter();
  const { user, isAuthenticated, sendMagicCode, verifyMagicCode, signOut } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await sendMagicCode(email);
      if (!result.success) {
        setErrorMessage(result.error || "Unable to send verification code. Please check your email.");
        return;
      }
      setDestination(result.destination || email);
      setStep("code");
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await verifyMagicCode(email, code);
      if (!result.success) {
        setErrorMessage(result.error || "Invalid code. Please check your email and try again.");
        return;
      }

      // Success! Route to founder onboarding if new, or target redirect
      if (result.hasFounderProfile) {
        router.push(redirectUrl);
      } else {
        router.push("/onboarding");
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage("");
    setIsResending(true);
    try {
      const result = await sendMagicCode(email);
      if (!result.success) {
        setErrorMessage(result.error || "Unable to resend code.");
      }
    } catch {
      setErrorMessage("Unable to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative w-full max-w-[360px] sm:max-w-[380px] px-4 py-8 mx-auto font-sans">
      {/* Top Right Close Button */}
      <Link
        href="/"
        className="absolute top-2 right-4 p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
        aria-label="Close and return to home"
      >
        <X className="h-6 w-6 stroke-[2]" />
      </Link>

      {/* Brand Header with Original Brand Logo */}
      <div className="text-center mb-8 pt-1 flex justify-center">
        <BrandLogo size="lg" />
      </div>

      {isAuthenticated && user ? (
        /* Authenticated Session State */
        <div className="space-y-6 pt-2 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Signed In</h2>
            <p className="mt-1 text-sm text-neutral-400 font-medium">
              {user.name} ({user.email})
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-neutral-400">
              <KeyRound className="h-3.5 w-3.5 text-[#E8FF54] shrink-0" />
              <span className="truncate max-w-[220px]">AWS Cognito Session Active</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="flex w-full items-center justify-center h-12 rounded-full bg-[#E8FF54] text-neutral-950 font-bold text-sm tracking-wide hover:bg-[#d8ef45] transition-colors"
            >
              Continue to Home
            </Link>

            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center justify-center gap-2 h-11 rounded-full border border-white/15 bg-transparent text-sm font-medium text-neutral-300 hover:text-rose-400 hover:border-rose-400/40 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      ) : step === "code" ? (
        /* Step 2: Verification Code Entry */
        <div>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setErrorMessage("");
            }}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Change email</span>
          </button>

          <h1 className="text-[26px] font-bold tracking-tight text-white mb-2">
            Enter Verification Code
          </h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            We sent a 6-digit confirmation code from AWS Cognito to{" "}
            <span className="font-semibold text-white font-mono">{destination || email}</span>.
          </p>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label
                htmlFor="auth-code"
                className="block text-sm font-normal text-white mb-2"
              >
                6-Digit Code
              </label>
              <input
                id="auth-code"
                type="text"
                required
                maxLength={8}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="h-12 w-full rounded-md border border-neutral-800 bg-[#0F0F12] px-3.5 text-center text-xl font-mono tracking-[0.3em] text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-[#E8FF54]"
              />
            </div>

            {errorMessage && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {errorMessage}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || code.length < 4}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#E8FF54] text-neutral-950 font-bold text-[15px] tracking-normal hover:bg-[#d8ef45] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                <span>{isSubmitting ? "Verifying Code..." : "Verify & Log In"}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
            <span>Didn&apos;t receive it?</span>
            <button
              type="button"
              disabled={isResending}
              onClick={handleResend}
              className="font-medium text-[#E8FF54] hover:underline disabled:opacity-50 cursor-pointer"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          </div>
        </div>
      ) : (
        /* Step 1: Email Input */
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-white mb-2">
            Log In
          </h1>
          <p className="text-sm text-neutral-400 mb-6">
            Enter your email to receive an instant verification code.
          </p>

          <form onSubmit={handleSendCode} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-normal text-white mb-2"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-12 w-full rounded-md border border-neutral-800 bg-[#0F0F12] px-3.5 text-sm text-white placeholder:text-neutral-600 outline-none transition-colors focus:border-neutral-500"
              />
            </div>

            {/* Cloudflare Turnstile Verification Badge */}
            <div className="pt-1">
              <div className="flex items-center justify-between rounded border border-neutral-700/80 bg-[#141417] px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium text-white">Success!</span>
                </div>
                <div className="flex flex-col items-end select-none">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-[#F38020]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M18.8 11.2c-.3-2.6-2.5-4.7-5.2-4.7-2.1 0-4 1.2-4.8 3-.5-.3-1.1-.4-1.8-.4-2.2 0-4 1.8-4 4 0 .3 0 .7.1 1h15.7c0-.2.1-.5.1-.8 0-1.2-.5-2.2-1.4-2.9z" />
                    </svg>
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">
                      CLOUDFLARE
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[9px] text-neutral-400">
                    <span className="hover:underline cursor-pointer">Privacy</span>
                    <span>•</span>
                    <span className="hover:underline cursor-pointer">Help</span>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {errorMessage}
              </div>
            )}

            {/* Primary Pill Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#E8FF54] text-neutral-950 font-bold text-[15px] tracking-normal hover:bg-[#d8ef45] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-md"
              >
                <span>
                  {isSubmitting ? "Sending Code..." : "Send Magic Code"}
                </span>
              </button>
            </div>
          </form>

          {/* Legal / Policy Disclaimer */}
          <div className="mt-12 text-center text-xs text-neutral-400 leading-relaxed">
            <p>By continuing, you agree to our policies</p>
            <p className="mt-1">
              <Link href="/terms" className="hover:text-neutral-200 underline underline-offset-2">
                Terms of use
              </Link>
              {" · "}
              <Link href="/privacy" className="hover:text-neutral-200 underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
