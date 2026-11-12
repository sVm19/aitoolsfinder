import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The AIToolsFinder dashboard is opening soon.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <ComingSoon
      eyebrow="Dashboard"
      title="Your dashboard is opening soon"
      description="Saved tools, followed categories, and account preferences will live here once accounts launch."
      breadcrumb="Dashboard"
    />
  );
}
