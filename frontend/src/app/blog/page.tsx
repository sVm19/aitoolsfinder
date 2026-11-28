import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guides & Blog — Practical AI Tool & SaaS Buying Guides",
  description:
    "Clear, unbiased guides on comparing AI tools by total cost, picking AI coding assistants, and building a lean software stack.",
  alternates: {
    canonical: canonicalUrl("/blog"),
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Guides & Blog | AIToolsFinder",
    description:
      "Practical guides on AI pricing audits, developer tools, and lean SaaS stacks.",
    url: canonicalUrl("/blog"),
    type: "website",
  },
};

export default function BlogIndexPage() {
  const blogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "AIToolsFinder Guides & Blog",
    url: canonicalUrl("/blog"),
    description:
      "Practical guides on comparing AI tools, auditing SaaS pricing, and building lean software stacks.",
    blogPost: BLOG_POSTS.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      url: canonicalUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        "@type": "Organization",
        name: post.authorName,
      },
    })),
  };

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides & Blog" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogListJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="max-w-3xl mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1 text-xs font-mono text-primary-content mb-4">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Buying Guides &amp; Pricing Audits</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Practical guides for choosing AI tools without guesswork.
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Plain-language breakdowns of AI software pricing, capability trade-offs, and
          real-world stack decisions.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface-1 p-6 transition-colors hover:border-primary/40"
          >
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground mb-3">
                <span className="rounded bg-primary/15 px-2 py-0.5 text-primary-content">
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <time dateTime={post.updatedAt}>Updated {post.updatedAt}</time>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{post.readTime}</span>
                </span>
              </div>

              <h2 className="text-xl font-semibold text-foreground leading-snug">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-primary-content transition-colors"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {post.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-subtle-foreground">{post.authorName}</span>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1.5 font-medium text-primary-content hover:text-white transition-colors"
              >
                <span>Read guide</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
