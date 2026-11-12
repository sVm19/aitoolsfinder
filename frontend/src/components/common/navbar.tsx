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

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const header = headerRef.current;
    const progress = progressRef.current;
    if (!header || !progress) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const context = gsap.context(() => {
      if (!reduce) {
        gsap.from("[data-nav-brand]", {
          y: -18,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
        });
        gsap.from("[data-nav-link]", {
          y: -14,
          autoAlpha: 0,
          stagger: 0.05,
          delay: 0.12,
          duration: 0.5,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
        });
        gsap.from("[data-nav-action]", {
          y: -10,
          autoAlpha: 0,
          stagger: 0.06,
          delay: 0.28,
          duration: 0.45,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
        });
      }

      gsap.to(progress, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          start: 0,
          end: "max",
          scrub: 0.25,
        },
      });

      ScrollTrigger.create({
        start: 12,
        onToggle: (self) => {
          header.classList.toggle("is-scrolled", self.isActive);
        },
      });
    }, header);

    return () => context.revert();
  }, []);

  // Keep keyboard focus inside the mobile navigation while it is open.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const focusableSelector =
      "a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
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

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const links = drawerRef.current?.querySelectorAll("[data-drawer-link]");
    const tween =
      !reduce && links && links.length
        ? gsap.from(links, {
            y: 16,
            autoAlpha: 0,
            stagger: 0.045,
            duration: 0.35,
            ease: "power2.out",
          })
        : null;

    return () => {
      tween?.kill();
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
        document.body.style.overflow = previousOverflow!;
      };
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Categories", href: "/categories", icon: Layers },
    { name: "Rankings", href: "/rankings", icon: Award },
    { name: "Compare", href: "/compare", icon: GitCompare },
    { name: "AI Finder", href: "/ai-finder", icon: Sparkles, highlight: true },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[background-color,box-shadow] duration-300"
    >
      <span ref={progressRef} className="nav-progress absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary via-accent to-primary" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-8">
          <Link href="/" data-nav-brand className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white shadow-lavender-glow transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
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
                  data-nav-link
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors relative ${
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
            data-nav-action
            className="flex items-center gap-2 h-9 px-3 rounded-full border border-border bg-surface-1 text-xs text-subtle-foreground hover:text-primary-content hover:border-primary/50 transition-colors overflow-hidden"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search the directory</span>
            <kbd className="ml-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-subtle-foreground">
              /
            </kbd>
          </Link>

          {/* GSAP-enhanced submit button with hover background */}
          <Link href="/submit" prefetch={false} data-nav-action>
            <Button variant="secondary" size="sm" className="rounded-full">
              Submit Tool
            </Button>
          </Link>

          <Link href="/ai-finder" prefetch={false} data-nav-action>
            <Button variant="primary" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Match
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
                  data-drawer-link
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
              href="/ai-finder"
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