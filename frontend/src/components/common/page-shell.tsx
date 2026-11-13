"use client";

import React from "react";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { Breadcrumbs, type BreadcrumbItems } from "@/components/common/breadcrumbs";
import { cn } from "@/lib/utils";

export interface PageShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItems;
  className?: string;
  containerClassName?: string;
  withAuroraGlow?: boolean;
}

export function PageShell({
  children,
  breadcrumbs,
  className,
  containerClassName,
  withAuroraGlow = true,
}: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative overflow-x-hidden">
      <Navbar />

      {/* Ambient background glow to unify all pages with home page aesthetic */}
      {withAuroraGlow && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
          <div className="aurora-blob aurora-blob-a opacity-25" />
          <div className="aurora-blob aurora-blob-b opacity-15" />
        </div>
      )}

      <main
        className={cn(
          "relative z-10 flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8",
          className
        )}
      >
        <div className={cn("mx-auto max-w-7xl", containerClassName)}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} className="mb-6 sm:mb-8" />
          )}
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
