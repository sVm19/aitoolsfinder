"use client";

import React from "react";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { Breadcrumbs, type BreadcrumbItems } from "@/components/common/breadcrumbs";
import { SmoothScrollShell } from "@/components/scroll/smooth-scroll-shell";
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

      {withAuroraGlow && (
        <div
          className="vt-site-aurora pointer-events-none fixed inset-0 overflow-hidden z-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(640px circle at 10% 15%, rgba(14, 165, 233, 0.08), transparent 60%), radial-gradient(560px circle at 90% 35%, rgba(255, 94, 30, 0.06), transparent 60%)",
          }}
        />
      )}

      <SmoothScrollShell>
        <main
          className={cn(
            "relative z-10 flex-1 px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8",
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
      </SmoothScrollShell>
    </div>
  );
}
