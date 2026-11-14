import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/site";
import { getActiveCategories } from "@/lib/catalog-api";
import { SubmissionView } from "./view";

export const metadata: Metadata = {
  title: "Submit Your AI SaaS & Get a Free Backlink | AIToolsFinder",
  description:
    "Submit your AI tool or B2B SaaS platform to AIToolsFinder. Receive a permanent free dofollow backlink, verified listing badge, and direct exposure to 50,000+ active software buyers.",
  alternates: { canonical: canonicalUrl("/submit") },
  robots: { index: true, follow: true },
};

export default async function SubmissionPage() {
  const categories = await getActiveCategories().catch(() => []);
  return <SubmissionView categories={categories} />;
}