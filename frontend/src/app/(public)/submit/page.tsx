import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/site";
import { getActiveCategories } from "@/lib/catalog-api";
import { SubmissionView } from "./view";

export const metadata: Metadata = {
  title: "Submit an AI Tool | AIToolsFinder",
  description:
    "Submit your AI tool or SaaS product to the AIToolsFinder catalog. Verified listings, pricing breakdowns, and direct founder exposure.",
  alternates: { canonical: canonicalUrl("/submit") },
  robots: { index: true, follow: true },
};

export default async function SubmissionPage() {
  const categories = await getActiveCategories().catch(() => []);
  return <SubmissionView categories={categories} />;
}