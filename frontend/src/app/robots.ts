import { MetadataRoute } from "next";
import { canonicalUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallowed = ["/admin/", "/api/", "/dashboard/", "/go/", "/redirect/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "Perplexity-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "Google-Extended",
          "Googlebot",
          "Applebot-Extended",
          "DeepSeekBot",
          "MiniMaxBot",
          "Bytespider",
          "CCBot",
          "Meta-ExternalAgent",
          "cohere-ai",
          "YouBot",
          "DuckAssistBot",
        ],
        allow: "/",
        disallow: disallowed,
      },
    ],
    sitemap: canonicalUrl("/sitemap.xml"),
    host: canonicalUrl("/"),
  };
}
