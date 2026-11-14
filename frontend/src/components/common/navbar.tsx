"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/common/brand-logo";
import {
  Search,
  Compass,
  Layers,
  Award,
  Sparkles,
  GitCompare,
  User,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { useStack } from "@/components/stack/stack-provider";

const NAV_LINKS = [
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Categories", href: "/categories", icon: Layers },
  { name: "Rankings", href: "/rankings", icon: Award },
  { name: "Compare", href: "/compare", icon: GitCompare },
  { name: "AI Finder", href: "/ai-finder", icon: Sparkles },
];

export function Navbar() {
  const { saveCount, openDrawer, openAuthModal } = useStack();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Subtle scroll styling toggle (scrolled state)
  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current) return;
      const isScrolled = window.scrollY > 16;
      headerRef.current.classList.toggle("is-scrolled", isScrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard accessibility and body scroll lock for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Auto-close drawer when resizing to tablet/desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 relative"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Identity & Primary Nav */}
          <div className="flex items-center gap-7">
            <BrandLogo size="md" />

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={false}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? "text-foreground bg-surface-2"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Quick Search */}
            <Link
              href="/explore"
              prefetch={false}
              className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-surface-1 text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              <Search className="w-3.5 h-3.5 opacity-70" />
              <span>Search directory</span>
              <kbd className="ml-1 rounded border border-border bg-surface-2 px-1 py-0.2 text-[10px] font-mono text-muted-foreground">
                /
              </kbd>
            </Link>

            {/* My Stack Drawer Trigger */}
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              aria-label="Open My AI Stack"
            >
              <Layers className="w-3.5 h-3.5 opacity-70" />
              <span>My Stack</span>
              {saveCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">
                  {saveCount}
                </span>
              )}
            </button>

            {/* Submit SaaS CTA */}
            <Link href="/submit" prefetch={false}>
              <Button variant="secondary" size="sm" className="h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 border-border hover:border-accent/40">
                <span>Submit SaaS</span>
                <span className="rounded bg-accent/15 px-1 py-0.2 text-[10px] font-semibold text-accent">
                  Free
                </span>
              </Button>
            </Link>

            {/* Sign in Trigger */}
            <button
              type="button"
              onClick={() => openAuthModal("Sign in to track price drops, upvote tools, and sync your stack.")}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
            >
              <User className="w-3.5 h-3.5 opacity-70" />
              <span>Sign in</span>
            </button>
          </div>

          {/* Mobile / Tablet Compact Action Bar */}
          <div className="flex lg:hidden items-center gap-1.5">
            {/* Quick Submit */}
            <Link
              href="/submit"
              prefetch={false}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-surface-1 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
            >
              <span>Submit</span>
              <span className="rounded bg-accent/20 px-1 py-0.2 text-[9px] font-bold text-accent">
                Free
              </span>
            </Link>

            {/* Quick Search */}
            <Link
              href="/explore"
              prefetch={false}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-surface-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Search directory"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-surface-1 text-foreground hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-foreground" />
              ) : (
                <Menu className="w-4 h-4 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* --- Shallow & Blurry Luminous Edge Transition --- */}
        {/* 1. Dynamic animated luminous beam along the seam */}
        <div
          className="header-luminous-edge pointer-events-none absolute inset-x-0 bottom-0 h-px"
          aria-hidden="true"
        />

        {/* 2. Soft diffused glow reflection beneath the hairline */}
        <div
          className="header-glow-reflection pointer-events-none absolute inset-x-0 bottom-[-1px] h-[3px]"
          aria-hidden="true"
        />

        {/* 3. Progressive feather blur extending below the header into the landing page */}
        <div
          className="header-feather-blur pointer-events-none absolute inset-x-0 -bottom-3.5 h-3.5 backdrop-blur-[8px]"
          aria-hidden="true"
        />
      </header>

      {/* Mobile Drawer (placed outside header to eliminate containing-block stacking context bugs) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 lg:hidden flex flex-col animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-14 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Navigation Drawer Surface */}
          <div
            ref={drawerRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="relative z-10 flex h-full max-h-[calc(100dvh-3.5rem)] w-full flex-col overflow-y-auto border-t border-border bg-background p-4 shadow-xl"
          >
            {/* 1. PRIMARY NAVIGATION OPTIONS (Clearly visible at the top) */}
            <div className="mb-4">
              <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Navigation
              </p>
              <nav className="flex flex-col space-y-1">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      prefetch={false}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-surface-2 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 opacity-75" />
                        <span>{link.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* 2. SEARCH SHORTCUT */}
            <div className="mb-4">
              <Link
                href="/explore"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-surface-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>Search 1,200+ tools...</span>
                </div>
                <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono">
                  /
                </kbd>
              </Link>
            </div>

            {/* 3. TASTEFUL FOUNDER SAAS CARD (Quiet, informative, no slop or cutoffs) */}
            <div className="mb-4">
              <Link
                href="/submit"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg border border-border bg-surface-1 p-3.5 transition-colors hover:border-accent/50 hover:bg-surface-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Submit Your SaaS</span>
                  <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    Free Listing <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Permanent dofollow backlink & verified indexing in the directory.
                </p>
              </Link>
            </div>

            {/* 4. ACTIONS: MY STACK & SIGN IN */}
            <div className="mt-auto pt-3 border-t border-border flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openDrawer();
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-lg border border-border bg-surface-1 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 opacity-70" />
                  <span>My AI Stack</span>
                </div>
                {saveCount > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">
                    {saveCount}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">0 saved</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal("Sign in to track price drops, upvote tools, and sync your stack.");
                }}
                className="flex w-full items-center justify-center gap-2 h-9 rounded-lg border border-border bg-surface-1 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
              >
                <User className="w-3.5 h-3.5 opacity-70" />
                <span>Sign in / Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
