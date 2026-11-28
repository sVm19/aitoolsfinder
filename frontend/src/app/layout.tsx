import { Suspense } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";

const plusJakarta = localFont({
  src: "./fonts/plus-jakarta-sans.woff2",
  weight: "500 800",
  variable: "--font-plus-jakarta",
  display: "swap",
});

const outfit = localFont({
  src: "./fonts/outfit.woff2",
  weight: "400 800",
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  weight: "400 700",
  variable: "--font-jetbrains",
  display: "swap",
});
import { canonicalUrl, SITE_URL } from "@/lib/site";
import { CompareProvider } from "@/components/comparison/compare-provider";
import { StackProvider } from "@/components/stack/stack-provider";
import { TiunProvider } from "@/components/providers/tiun-provider";
import { AuthProvider } from "@/lib/auth-context";
import { StackDrawer } from "@/components/stack/stack-drawer";
import { AuthModal } from "@/components/common/auth-modal";
import { ButtonRipple } from "@/components/common/button-ripple";
import { AttributionTracker } from "@/components/common/attribution-tracker";
import { ViewTransitionProvider } from "@/components/common/view-transition-provider";

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
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${plusJakarta.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      data-type="software"
    >
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        <ViewTransitionProvider />
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