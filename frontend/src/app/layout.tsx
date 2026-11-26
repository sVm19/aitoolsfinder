import { Suspense } from "react";
import type { Metadata } from "next";
import "@/styles/globals.css";
import { canonicalUrl, SITE_URL } from "@/lib/site";
import { CompareProvider } from "@/components/comparison/compare-provider";
import { StackProvider } from "@/components/stack/stack-provider";
import { TiunProvider } from "@/components/providers/tiun-provider";
import { AuthProvider } from "@/lib/auth-context";
import { StackDrawer } from "@/components/stack/stack-drawer";
import { AuthModal } from "@/components/common/auth-modal";
import { ButtonRipple } from "@/components/common/button-ripple";
import { AttributionTracker } from "@/components/common/attribution-tracker";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AIToolsFinder — Find the Best AI Tool & SaaS For Your Exact Job",
    template: "%s | AIToolsFinder",
  },
  description:
    "The verified AI & SaaS intelligence directory. Discover, compare, and benchmark 1,200+ AI tools and B2B SaaS platforms. Audited pricing, capability teardowns, and free backlinks for SaaS founders.",
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
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
    <html lang="en" suppressHydrationWarning className="dark" data-type="software">
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        <ButtonRipple />
        <Suspense fallback={null}>
          <AttributionTracker />
        </Suspense>
        <AuthProvider>
          <CompareProvider>
            <StackProvider>
              <TiunProvider>
                {children}
                <StackDrawer />
                <AuthModal />
              </TiunProvider>
            </StackProvider>
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}