import type { Metadata } from "next";
import { FounderOnboarding } from "@/components/founder/founder-onboarding";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Founder Onboarding · AIToolsFinder",
  description: "Complete your Founder Profile to verify your products and claim your founder trust badge.",
  alternates: {
    canonical: canonicalUrl("/onboarding"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white flex items-center justify-center py-6">
      <FounderOnboarding />
    </div>
  );
}
