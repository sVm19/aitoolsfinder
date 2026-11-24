import { MetadataRoute } from "next";
import { canonicalUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/go/",
          "/redirect/",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/go/",
          "/redirect/",
        ],
      },
    ],
    sitemap: canonicalUrl("/sitemap.xml"),
  };
}
