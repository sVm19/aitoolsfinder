"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  Menu,
  X,
  Compass,
  Layers,
  Award,
  Sparkles,
  GitCompare,
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Keep keyboard focus inside the mobile navigation while it is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const focusableSelector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Categories", href: "/categories", icon: Layers },
    { name: "Rankings", href: "/rankings", icon: Award },
    { name: "Compare", href: "/compare", icon: GitCompare },
    { name: "AI Finder", href: "/finder", icon: Sparkles, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white shadow-lavender-glow transition-transform duration-200 group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground group-hover:text-white transition-colors">
                AIToolsFinder<span className="text-accent">.</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-subtle-foreground -mt-1 uppercase">
                Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={false}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    link.highlight
                      ? "text-primary-content hover:text-white hover:bg-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-75" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Quick Search Trigger */}
          <Link
            href="/explore"
            prefetch={false}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface-1 text-xs text-subtle-foreground hover:text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search 1,240+ tools...</span>
            <kbd className="ml-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-subtle-foreground">
              /
            </kbd>
          </Link>

          <Link href="/submit" prefetch={false}>
            <Button variant="secondary" size="sm">
              Submit Tool
            </Button>
          </Link>

          <Link href="/finder" prefetch={false}>
            <Button variant="primary" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              AI Match
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/explore"
            prefetch={false}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="Search tools"
          >
            <Search className="w-5 h-5" />
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-haspopup="dialog"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Slide-over */}
      {mobileMenuOpen && (
        <div
          ref={drawerRef}
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl lg:hidden border-t border-border flex flex-col p-6 animate-in fade-in duration-200"
        >
          <nav className="flex flex-col space-y-2 mb-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    link.highlight
                      ? "bg-primary/15 text-primary-content border border-primary/30"
                      : "text-foreground hover:bg-surface-2"
                  }`}
                >
                  <Icon className="w-5 h-5 opacity-80" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-6 border-t border-border">
            <Link
              href="/submit"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="block"
            >
              <Button variant="secondary" size="lg" className="w-full">
                Submit a Tool
              </Button>
            </Link>
            <Link
              href="/finder"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="block"
            >
              <Button variant="primary" size="lg" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Find matching tools
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

