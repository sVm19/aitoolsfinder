import type { Metadata } from "next";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Accounts for AIToolsFinder are opening soon.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <ComingSoon
      eyebrow="Accounts"
      title="Sign-up is opening soon"
      description="Account creation, saved tools, and vendor profiles are part of an upcoming release. Until then, the catalog and AI Finder are open to everyone."
      breadcrumb="Create an account"
    />
  );
}
