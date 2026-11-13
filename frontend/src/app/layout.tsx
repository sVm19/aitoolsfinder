import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "@/styles/globals.css";
import { canonicalUrl, SITE_URL } from "@/lib/site";
import { CompareProvider } from "@/components/comparison/compare-provider";
import { CustomCursor } from "@/components/bits/custom-cursor";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

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
    <html lang="en" className={`dark ${outfit.variable} ${jetbrains.variable}`} data-type="software">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        <div className="site-grain" aria-hidden="true" />
        <CustomCursor />
        <CompareProvider>{children}</CompareProvider>
      </body>
    </html>
  );
}