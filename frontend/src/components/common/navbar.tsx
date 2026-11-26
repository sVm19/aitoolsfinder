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
  ArrowRight,
  FolderGit2,
  Settings,
  LogOut,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { useStack } from "@/components/stack/stack-provider";
import { useAuth } from "@/lib/auth-context";
import {
  gsap,
  MorphSVGPlugin,
  Observer,
  ScrollTrigger,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";

const NAV_LINKS = [
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Categories", href: "/categories", icon: Layers },
  { name: "Rankings", href: "/rankings", icon: Award },
  { name: "Compare", href: "/compare", icon: GitCompare },
  { name: "AI Finder", href: "/ai-finder", icon: Sparkles },
];

export function Navbar() {
  const { saveCount, openDrawer, openAuthModal } = useStack();
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const menuTopLineRef = useRef<SVGPathElement>(null);
  const menuMidLineRef = useRef<SVGPathElement>(null);
  const menuBotLineRef = useRef<SVGPathElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  // GSAP ScrollTrigger progress bar + scrolled state
  useGSAP(
    () => {
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            start: 0,
            end: "max",
            scrub: true,
          },
        });
      }

      const st = ScrollTrigger.create({
        start: 16,
        end: "max",
        onEnter: () => headerRef.current?.classList.add("is-scrolled"),
        onLeaveBack: () => headerRef.current?.classList.remove("is-scrolled"),
      });

      if (window.scrollY > 16) {
        headerRef.current?.classList.add("is-scrolled");
      }

      return () => {
        st.kill();
      };
    },
    { scope: headerRef }
  );

  // MorphSVG mobile menu icon (Hamburger <-> Close X)
  useGSAP(
    () => {
      const top = menuTopLineRef.current;
      const mid = menuMidLineRef.current;
      const bot = menuBotLineRef.current;
      if (!top || !mid || !bot) return;

      const dur = prefersReducedMotion() ? 0 : 0.28;

      if (mobileMenuOpen) {
        gsap.to(top, {
          morphSVG: "M5 5L19 19",
          duration: dur,
          ease: "earlyst-out",
        });
        gsap.to(mid, {
          opacity: 0,
          scaleX: 0.2,
          transformOrigin: "center",
          duration: dur * 0.6,
        });
        gsap.to(bot, {
          morphSVG: "M5 19L19 5",
          duration: dur,
          ease: "earlyst-out",
        });
      } else {
        gsap.to(top, {
          morphSVG: "M4 6H20",
          duration: dur,
          ease: "earlyst-out",
        });
        gsap.to(mid, {
          opacity: 1,
          scaleX: 1,
          duration: dur * 0.8,
        });
        gsap.to(bot, {
          morphSVG: "M4 18H20",
          duration: dur,
          ease: "earlyst-out",
        });
      }
      void MorphSVGPlugin;
    },
    { dependencies: [mobileMenuOpen] }
  );

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

  // Close drawer & profile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 inset-x-0 z-50 w-full bg-background/95 border-b border-border/70 transition-[background-color,box-shadow] duration-200"
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
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Quick Search */}
            <Link
              href="/explore"
              prefetch={false}
              className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-surface-1 text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors shrink-0"
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
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shrink-0"
              aria-label="Open My AI Stack"
            >
              <Heart className="w-3.5 h-3.5 opacity-80 text-rose-400" />
              <span>My Stack</span>
              {saveCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {saveCount}
                </span>
              )}
            </button>

            {/* Submitted Tools / SaaS button */}
            <Link
              href="/dashboard?tab=submissions"
              prefetch={false}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors shrink-0"
              title="View your submitted AI tools & SaaS status"
            >
              <FolderGit2 className="w-3.5 h-3.5 opacity-80 text-accent" />
              <span>Submissions</span>
            </Link>

            {/* Submit SaaS CTA */}
            <Link href="/submit" prefetch={false} className="shrink-0">
              <Button variant="secondary" size="sm" className="h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 border-border hover:border-accent/40">
                <span>Submit SaaS</span>
                <span className="rounded bg-accent/15 px-1 py-0.2 text-[10px] font-semibold text-accent">
                  Free
                </span>
              </Button>
            </Link>

            {/* User Account State / Profile Dropdown / Sign In */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={profileMenuRef}>
                {/* Circular Avatar Button */}
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-xs font-bold text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/25 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 shadow-sm"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                  title={`Account: ${user.email}`}
                >
                  <span className="uppercase select-none">
                    {user.name ? user.name.charAt(0) : user.email ? user.email.charAt(0) : "U"}
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-background" />
                </button>

                {/* Profile Dropdown Menu - Solid, completely opaque, zero background bleed-through */}
                {profileMenuOpen && (
                  <div className="absolute right-0 top-11 z-[100] w-64 rounded-2xl border border-white/15 bg-[#0e0e11] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)] animate-in fade-in zoom-in-95 duration-100">
                    {/* User Info Header */}
                    <div className="px-2.5 py-2.5 border-b border-border/80 mb-1 bg-surface-1/60 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{user.name || "Founder"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/25">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Member
                        </span>
                      </div>
                    </div>

                    {/* Nav Links */}
                    <div className="flex flex-col gap-0.5 text-xs">
                      <Link
                        href="/dashboard?tab=profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                      >
                        <User className="w-4 h-4 opacity-70" />
                        <span>Founder Profile</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=submissions"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <FolderGit2 className="w-4 h-4 opacity-70 text-accent" />
                          <span>Submitted Tools / SaaS</span>
                        </div>
                        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          Active
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          openDrawer();
                        }}
                        className="flex items-center justify-between px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Heart className="w-4 h-4 opacity-70 text-rose-400" />
                          <span>My AI Stack</span>
                        </div>
                        {saveCount > 0 && (
                          <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-300">
                            {saveCount}
                          </span>
                        )}
                      </button>

                      <Link
                        href="/onboarding"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                      >
                        <Settings className="w-4 h-4 opacity-70" />
                        <span>Edit Founder Links & Bio</span>
                      </Link>
                    </div>

                    <div className="mt-1 pt-1 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 opacity-70" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                prefetch={false}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
              >
                <User className="w-3.5 h-3.5 opacity-70" />
                <span>Sign In</span>
              </Link>
            )}
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

            {/* Mobile Menu Button (MorphSVG animated) */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-surface-1 text-foreground hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="w-4 h-4 text-foreground"
                aria-hidden="true"
              >
                <path ref={menuTopLineRef} d="M4 6H20" />
                <path ref={menuMidLineRef} d="M4 12H20" />
                <path ref={menuBotLineRef} d="M4 18H20" />
              </svg>
            </button>
          </div>
        </div>

        {/* ScrollTrigger Progress Line */}
        <div
          ref={progressRef}
          className="nav-progress pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-primary via-primary-hover to-accent"
          aria-hidden="true"
        />

        {/* --- Shallow & Blurry Luminous Edge Transition --- */}
        {/* 1. Dynamic animated luminous beam along the seam */}
        <div
          className="header-luminous-edge pointer-events-none absolute inset-x-0 bottom-0 h-px"
          aria-hidden="true"
        />

        {/* 2. Soft diffused glow reflection beneath the hairline */}
        <div
          className="header-glow-reflection pointer-events-none absolute inset-x-0 bottom-[-1px] h-[2px]"
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

            {/* 4. ACTIONS: MY STACK, SUBMISSIONS, & PROFILE */}
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
                  <Heart className="w-4 h-4 opacity-70 text-rose-400" />
                  <span>My AI Stack</span>
                </div>
                {saveCount > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {saveCount}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">0 saved</span>
                )}
              </button>

              <Link
                href="/dashboard?tab=submissions"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 rounded-lg border border-border bg-surface-1 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FolderGit2 className="w-4 h-4 opacity-70 text-accent" />
                  <span>Submitted Tools / SaaS</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-40" />
              </Link>

              {isAuthenticated && user ? (
                <div className="flex flex-col gap-2 w-full pt-1">
                  <Link
                    href="/dashboard?tab=profile"
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 font-medium"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="truncate">{user.name || "Founder Profile"}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">View</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="h-9 px-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs text-rose-400 font-medium hover:bg-rose-500/20 transition-colors w-full text-center"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 h-9 rounded-lg border border-border bg-surface-1 text-xs font-medium text-foreground hover:bg-surface-2 transition-colors"
                >
                  <User className="w-3.5 h-3.5 opacity-70" />
                  <span>Sign In to Account</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
