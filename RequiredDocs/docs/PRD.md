# Product Requirements Document (PRD)

## 1. Product overview
Build an AI Tool Intelligence Platform where users can discover, compare and evaluate AI tools, GPTs and SaaS products. Each listing has a useful, structured profile. The platform helps users select a tool for a specific job in under 60 seconds.

## 2. Problem
AI product discovery is fragmented. Users struggle to determine which tools fit their use case, compare capabilities and pricing, identify alternatives, and distinguish useful products from promotional listings.

## 3. Product proposition
**Find the best AI tool for your exact job.**

The product differentiates itself through structured tool data, transparent comparisons, explainable intelligence scores, pricing information, alternatives and use-case recommendations.

## 4. Target users
- Individuals exploring AI tools
- Marketers, SEO professionals and creators
- Developers and technical teams
- Small businesses and founders
- Vendors submitting or promoting their products

## 5. Product goals
1. Make relevant tools discoverable through search and category navigation.
2. Help users compare tools on consistent criteria.
3. Explain why a tool is recommended.
4. Create high-quality, indexable pages for tools, categories and comparisons.
5. Build trust through transparent data provenance and sponsored-placement disclosure.
6. Create monetization opportunities through affiliate referrals, clearly labelled sponsored listings and vendor plans.

## 6. Non-goals for the initial MVP
- Building a general-purpose AI chatbot.
- Hosting or executing third-party AI tools.
- Claiming independent benchmark results without a repeatable test methodology.
- Scraping websites in ways that violate terms, robots rules or applicable law.
- Launching a complex multi-vendor billing marketplace.
- Microservices or Kubernetes.

## 7. MVP scope

### P0 — launch-critical
- Public homepage
- Browse and explore tools
- Category and tag pages
- Tool detail pages
- Search with filters and pagination
- Admin-managed tool CRUD
- Tool categories and tags
- Pricing-plan records
- SEO metadata, canonical URLs, sitemap and robots rules
- Responsive layouts
- Basic analytics and error logging
- Authentication for admin access

### P1 — post-MVP
- Side-by-side comparisons
- Alternatives pages
- Transparent tool scoring and rankings
- User accounts and saved tools
- Vendor submissions and moderation
- Affiliate click tracking
- AI-assisted natural-language recommendations

### P2 — later
- Vendor self-service dashboard
- Paid featured placements
- User reviews and ratings
- Pricing change alerts
- Advanced intelligence reports
- Personalized discovery

## 8. Core user journeys

### Journey A: discover
Homepage → search or category → results → tool detail → official website.

### Journey B: compare
Tool detail or search results → select tools → comparison → evaluate differences → official website.

### Journey C: find alternatives
Tool detail → alternatives → alternative profile → official website.

### Journey D: vendor submission
Submit tool form → validation → pending moderation → admin review → approved listing or rejection → vendor notification.

### Journey E: save a tool
Browse publicly → sign in when saving → save tool → view saved tools in dashboard.

## 9. Functional requirements
- Every published tool has a unique, stable slug.
- A tool can belong to multiple categories and have multiple tags.
- Tool pages display only fields that are available and verified.
- Pricing must include currency, billing interval, plan name, source URL and last-verified date where known.
- Tool records support draft, pending_review, published, rejected and archived states.
- Admin actions must be authorized on the server.
- Search supports query, category, tags, pricing model and sort options.
- All list endpoints support pagination and bounded page sizes.
- Comparisons must use normalized feature and pricing data.
- Scores must expose methodology, dimensions, evidence and last-calculated date.
- Sponsored placements must be visibly labelled and must not silently alter organic rankings.

## 10. Non-functional requirements
- SEO pages render meaningful content server-side.
- Meet Core Web Vitals targets where practical: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- WCAG 2.2 AA is the accessibility target.
- Use secure passwordless or managed authentication through Cognito as configured.
- API validation and authorization happen server-side.
- Provide useful loading, empty, error and retry states.
- Support mobile, tablet and desktop.
- Avoid loading Three.js on pages that do not need it.

## 11. Success metrics
- Search-to-tool-detail click-through rate
- Tool-detail-to-outbound-click conversion
- Search zero-result rate
- Comparison usage and completion
- Returning visitor rate
- Organic landing-page impressions and clicks
- Published listing freshness
- Vendor submission approval rate
- Affiliate conversion rate where provider reporting permits

## 12. Open decisions
- Final brand name and domain
- Exact launch taxonomy and category hierarchy
- Initial tool dataset and data sourcing policy
- Final Tiun Business API and webhook capabilities
- Whether PostgreSQL is self-managed or managed
- Review moderation policy
- Exact scoring dimensions and weighting
