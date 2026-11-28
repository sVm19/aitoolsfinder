import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, User } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog-posts";
import { canonicalUrl } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return { title: "Guide Not Found", robots: { index: false, follow: true } };
  }

  const url = canonicalUrl(`/blog/${encodeURIComponent(post.slug)}`);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${post.title} | AIToolsFinder`,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const url = canonicalUrl(`/blog/${encodeURIComponent(post.slug)}`);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    mainEntityOfPage: url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: post.authorName,
      url: canonicalUrl("/about"),
    },
    publisher: {
      "@type": "Organization",
      name: "AIToolsFinder",
      url: canonicalUrl("/"),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <PageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides & Blog", href: "/blog" },
        { label: post.title },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to all guides</span>
          </Link>
        </div>

        <header className="mb-8 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground mb-3">
            <span className="rounded bg-primary/15 px-2 py-0.5 text-primary-content">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={post.updatedAt}>Last updated {post.updatedAt}</time>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readTime}</span>
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl leading-tight">
            {post.title}
          </h1>

          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            {post.description}
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-subtle-foreground">
            <User className="h-3.5 w-3.5" />
            <span>
              By <strong className="text-foreground">{post.authorName}</strong> ·{" "}
              {post.authorRole}
            </span>
          </div>
        </header>

        {/* Quick Answer / TL;DR for GEO & fast scanning */}
        <section
          aria-label="Summary"
          className="mb-8 rounded-xl border border-primary/30 bg-surface-1 p-5"
        >
          <p className="text-xs font-mono uppercase tracking-wider text-primary-content mb-2">
            Quick Summary
          </p>
          <p className="text-sm text-foreground leading-relaxed">{post.tldr}</p>
        </section>

        {/* Article Sections */}
        <div className="space-y-8">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {section.heading}
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {section.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-3 list-disc pl-5 space-y-2 text-sm sm:text-base text-muted-foreground">
                  {section.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Structured Comparison Table */}
          <section aria-label={post.comparisonTable.caption}>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {post.comparisonTable.caption}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-2 text-xs font-mono uppercase text-muted-foreground">
                  <tr>
                    {post.comparisonTable.columns.map((col) => (
                      <th key={col} className="px-4 py-3 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {post.comparisonTable.rows.map((row) => (
                    <tr key={row.option}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {row.option}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-primary-content">
                        {row.startingPrice}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.bestFor}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.tradeoff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ Section */}
          <section aria-label="Frequently asked questions">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <dl className="space-y-4">
              {post.faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl border border-border bg-surface-1 p-4"
                >
                  <dt className="text-sm font-semibold text-foreground">
                    {faq.question}
                  </dt>
                  <dd className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Related Directory Links */}
        <footer className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-3">
          {post.relatedLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-3.5 py-2 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-surface-2 transition-colors"
            >
              <span>{item.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary-content" />
            </Link>
          ))}
        </footer>
      </article>
    </PageShell>
  );
}
