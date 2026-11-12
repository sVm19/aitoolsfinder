import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How AIToolsFinder collects, uses, shares, and protects personal information.",
  alternates: { canonical: canonicalUrl("/privacy") },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "November 12, 2026";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs
            className="mb-8"
            items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
          />
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-content">
              Legal · Privacy
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              This policy explains what information AIToolsFinder.cloud collects,
              why we collect it, and the choices you have. It applies to the
              website, the AI Finder, vendor submissions, and outbound tool links.
            </p>
            <p className="mt-2 text-sm text-subtle-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <div className="mt-9 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section aria-labelledby="privacy-collect">
              <h2 id="privacy-collect" className="text-xl font-semibold text-foreground">
                Information we collect
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-primary-content">
                <li>
                  <span className="text-foreground">Account information.</span> If you
                  sign in, authentication is handled by Amazon Cognito. We receive
                  your email address, display name, and a stable account identifier.
                </li>
                <li>
                  <span className="text-foreground">AI Finder content.</span> Queries
                  you submit to the AI Finder are sent to our AI model provider to
                  generate recommendations. Feedback you choose to record may be
                  stored with the query and the rated tool.
                </li>
                <li>
                  <span className="text-foreground">Vendor submissions.</span> When
                  you submit a tool or claim a vendor profile, we collect the contact
                  details, company information, and tool details you provide.
                </li>
                <li>
                  <span className="text-foreground">Outbound click data.</span> When
                  you follow a link to a third-party tool, we may record the tool,
                  timestamp, IP address, and browser user-agent to measure referral
                  traffic and prevent abuse.
                </li>
                <li>
                  <span className="text-foreground">Technical data.</span> Our hosting
                  and database providers process standard request logs needed to
                  operate and secure the service.
                </li>
              </ul>
            </section>

            <section aria-labelledby="privacy-use">
              <h2 id="privacy-use" className="text-xl font-semibold text-foreground">
                How we use information
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-primary-content">
                <li>Provide, operate, and secure the catalog, rankings, and AI Finder.</li>
                <li>Authenticate accounts and apply role-based access controls.</li>
                <li>Process vendor submissions and respond to support requests.</li>
                <li>Measure outbound referrals and affiliate performance in aggregate.</li>
                <li>Improve recommendation quality and detect misuse or abuse.</li>
                <li>Comply with legal obligations and enforce our terms.</li>
              </ul>
            </section>

            <section aria-labelledby="privacy-share">
              <h2 id="privacy-share" className="text-xl font-semibold text-foreground">
                How we share information
              </h2>
              <p className="mt-3">
                We do not sell personal information. We share it only with service
                providers that help us run the platform, and only as needed:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-primary-content">
                <li>
                  <span className="text-foreground">Amazon Web Services</span> for
                  authentication (Cognito), media storage (S3/CloudFront), and hosting.
                </li>
                <li>
                  <span className="text-foreground">Supabase</span> for managed
                  PostgreSQL database hosting.
                </li>
                <li>
                  <span className="text-foreground">OpenRouter</span> to process AI
                  Finder queries with the configured language model.
                </li>
                <li>
                  <span className="text-foreground">Resend</span> to deliver
                  transactional email such as submission confirmations.
                </li>
                <li>
                  <span className="text-foreground">Affiliate networks</span> when you
                  follow an outbound tool link, subject to their own privacy policies.
                </li>
                <li>
                  Authorities or other parties when required by law or necessary to
                  protect rights, safety, and the integrity of the service.
                </li>
              </ul>
            </section>

            <section aria-labelledby="privacy-cookies">
              <h2 id="privacy-cookies" className="text-xl font-semibold text-foreground">
                Cookies and local storage
              </h2>
              <p className="mt-3">
                We do not run advertising or third-party analytics trackers. Sign-in
                sessions may use cookies or browser storage set by our authentication
                provider. Comparison selections are kept in page state and are not
                persisted to your device.
              </p>
            </section>

            <section aria-labelledby="privacy-retention">
              <h2 id="privacy-retention" className="text-xl font-semibold text-foreground">
                Retention and security
              </h2>
              <p className="mt-3">
                We keep information for as long as needed to operate the service,
                meet legal obligations, and resolve disputes. Data is transmitted over
                HTTPS and access to production systems is restricted. No method of
                transmission or storage is completely secure, so we cannot guarantee
                absolute security.
              </p>
            </section>

            <section aria-labelledby="privacy-rights">
              <h2 id="privacy-rights" className="text-xl font-semibold text-foreground">
                Your choices and rights
              </h2>
              <p className="mt-3">
                Depending on where you live, you may have the right to access,
                correct, export, or delete personal information, or to object to
                certain processing. To make a request, contact us at{" "}
                <a
                  href="mailto:ops@aitoolsfinder.cloud"
                  className="text-primary-content underline underline-offset-4 hover:text-foreground"
                >
                  ops@aitoolsfinder.cloud
                </a>
                . We may need to verify your identity before acting on a request.
              </p>
            </section>

            <section aria-labelledby="privacy-children">
              <h2 id="privacy-children" className="text-xl font-semibold text-foreground">
                Children
              </h2>
              <p className="mt-3">
                The service is not directed to children under 13, and we do not
                knowingly collect personal information from them.
              </p>
            </section>

            <section aria-labelledby="privacy-changes">
              <h2 id="privacy-changes" className="text-xl font-semibold text-foreground">
                Changes to this policy
              </h2>
              <p className="mt-3">
                We may update this policy as the service evolves. Material changes
                will be reflected by the date above. Continued use of the service
                after an update means you accept the revised policy.
              </p>
            </section>

            <section aria-labelledby="privacy-contact">
              <h2 id="privacy-contact" className="text-xl font-semibold text-foreground">
                Contact
              </h2>
              <p className="mt-3">
                Questions about this policy can be sent to{" "}
                <a
                  href="mailto:ops@aitoolsfinder.cloud"
                  className="text-primary-content underline underline-offset-4 hover:text-foreground"
                >
                  ops@aitoolsfinder.cloud
                </a>
                . See also our{" "}
                <Link
                  href="/terms"
                  className="text-primary-content underline underline-offset-4 hover:text-foreground"
                >
                  Terms of Service
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
