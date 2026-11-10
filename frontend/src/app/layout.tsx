import type { Metadata } from "next";
import "@/styles/globals.css";
import { canonicalUrl, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AIToolsFinder — Find the Best AI Tool For Your Exact Job",
    template: "%s | AIToolsFinder",
  },
  description:
    "Discover, compare, evaluate, and choose the best AI tools, GPTs, and SaaS products. Ground-truth intelligence, pricing breakdowns, and transparent scoring.",
  alternates: {
    canonical: canonicalUrl("/"),
  },
  openGraph: {
    title: "AIToolsFinder — AI Tool Intelligence Platform",
    description: "Find the best AI tool for your exact job.",
    url: canonicalUrl("/"),
    siteName: "AIToolsFinder",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIToolsFinder — AI Tool Intelligence Platform",
    description: "Find the best AI tool for your exact job in under 60 seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-type="software">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}

