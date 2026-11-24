# Schema.org JSON-LD Code Templates

Use these production-ready schema generators when fixing projects during **Phase 2**.

---

## 1. Next.js App Router (Root Page or Layout)

### WebSite & Organization Schema:
```tsx
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "YourAppName",
  url: "https://yourdomain.com",
  description: "One-sentence proposition for your exact job.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://yourdomain.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "YourAppName",
  url: "https://yourdomain.com",
  logo: "https://yourdomain.com/logo.svg",
};
```

### Rendering in JSX:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
  }}
/>
```

---

## 2. SoftwareApplication Schema (for SaaS & AI Tools)

```tsx
const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "YourToolName",
  url: "https://yourdomain.com",
  description: "Accurate product summary and key capability description.",
  applicationCategory: "DeveloperApplication", // or BusinessApplication, DesignApplication, etc.
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
```

---

## 3. Dynamic Next.js App Router Sitemap (`app/sitemap.ts`)

```typescript
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
```

---

## 4. Next.js App Router Robots (`app/robots.ts`)

```typescript
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/"],
      },
      {
        userAgent: ["GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Applebot-Extended"],
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```
