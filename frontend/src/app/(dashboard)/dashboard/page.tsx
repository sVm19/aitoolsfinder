import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Submitted Tools & Founder Dashboard",
  description: "Manage your submitted AI tools, review status, and founder profile on AIToolsFinder.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="h-64 rounded-3xl border border-border bg-surface-1/60 animate-pulse" />
        </div>
      }
    >
      <DashboardView />
    </Suspense>
  );
}
