import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log In · AIToolsFinder",
  description: "Log in to your AIToolsFinder account to access your saved stacks and preferences.",
  alternates: {
    canonical: canonicalUrl("/login"),
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-white">
      <AuthCard redirectUrl="/" />
    </div>
  );
}
