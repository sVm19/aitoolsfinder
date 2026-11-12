import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Accounts for AIToolsFinder are opening soon.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <ComingSoon
      eyebrow="Accounts"
      title="Sign-in is opening soon"
      description="Saved tools, dashboards, and vendor accounts are part of an upcoming release. Until then, the catalog and AI Finder are open to everyone."
      breadcrumb="Sign in"
    />
  );
}
