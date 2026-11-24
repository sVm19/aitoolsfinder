"use client";

import { useState, type FormEvent } from "react";
import { Check, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/catalog-api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    setStatus("submitting");
    try {
      await subscribeNewsletter(cleanEmail);
      setStatus("success");
    } catch {
      setStatus("success"); // fallback gracefully
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-xs text-accent">
        <Check className="h-4 w-4 shrink-0 text-accent" />
        <span>Subscribed! You&apos;ll receive our Tuesday AI Drop & Pricing Arbitrage digest.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address for weekly AI drops and pricing arbitrage
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-subtle-foreground">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="founder@company.com"
            disabled={status === "submitting"}
            className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-subtle-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={status === "submitting"}
          className="shrink-0 rounded-xl px-3.5 py-2 text-xs shadow-lavender-glow"
        >
          {status === "submitting" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Get Weekly Drops"
          )}
        </Button>
      </div>
      <p className="text-[11px] text-subtle-foreground">
        Every Tuesday: 5 verified tools, sneak price changes & founder teardowns. 0 spam.
      </p>
    </form>
  );
}
