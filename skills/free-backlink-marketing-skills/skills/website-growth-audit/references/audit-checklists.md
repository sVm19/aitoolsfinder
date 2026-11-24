# Audit Checklists

Read the section for each lens as you audit it. Contents: 1 Positioning, 2 Buttons/CTAs, 3 Design system, 4 User flows, 5 Acquisition, 6 Trust, 7 Conversion, 8 Retention, 9 Technical.

## 1. Positioning and messaging
- Headline states the outcome for a specific person, not a vague category.
- Subheadline explains how, in plain words. No jargon the customer doesn't use.
- Clear answer to: what is it, who is it for, why this over alternatives, what do I do next.
- Value proposition is consistent across homepage, meta title, social previews, and footer.
- Claims are specific and provable. Flag superlatives and vague promises.
- Reading level and tone match the audience.

## 2. Buttons and CTAs (for every one)
Record: page | label | destination | type (primary/secondary/tertiary/link) | verdict.
- Label says what happens next (verb + outcome). Flag: Submit, Click here, Learn more used where something clearer exists.
- One dominant primary action per viewport; secondary actions visibly quieter.
- Destination matches the promise in the label. Flag dead links, # links, redirects to the wrong page.
- Consistent label for the same action across the site.
- Size and tap target at least about 44px on mobile; spacing from neighbors.
- States exist: hover, focus (visible), active, disabled, loading.
- Placement: above the fold, after proof, end of long sections, sticky on mobile only if not obstructive.
- Friction notes near the button (price, "no card required" ONLY if true, privacy line).
- Contrast of text on the button meets accessibility guidance.

## 3. Design system
- Type: limited families, defined scale (e.g. 5-7 sizes), line-height and line length readable, clear heading hierarchy.
- Color: defined roles (primary, accent, neutral, success, warning, danger); text contrast; color is not the only signal.
- Spacing: a consistent scale; rhythm between sections; alignment to a grid.
- Components: buttons, inputs, cards, nav, modals, badges, toasts behave and look the same everywhere.
- Imagery and icons: one style, purposeful, alt text, no stock-photo vagueness that adds no information.
- Motion: purposeful, respects reduced-motion preferences.
- Responsive: breakpoints, nav on mobile, tables and forms on small screens.
- Empty, error, and loading states designed, not default.
- Accessibility basics: keyboard navigation, focus order, labels, alt text, semantic headings.

## 4. User flows
For each key journey list steps, then per step: user goal, what the page offers, friction, unanswered question, exit risk.
Journeys: first visit to understanding; understanding to signup/purchase; signup to first value; pricing evaluation; support/help; returning user; cancellation.
- Count clicks and fields to the first win. Remove any that don't earn their place.
- Check dead ends (pages with no next step) and loops.

## 5. Acquisition
- Which channels fit the audience and stage: organic search, content, communities, social, partnerships, directories, email, referrals, paid. Rank by fit and cost for this site's stage; do not recommend everything.
- Landing pages per intent (problem, comparison, alternative, use case), not just a homepage.
- SEO basics: unique titles and descriptions, one H1, search-intent match, internal linking, indexability, sitemap.
- Content: does it answer real questions the buyer has, and lead to a next step?
- Share loops: shareable outputs, honest social previews.
- Message match between where traffic comes from and where it lands.

## 6. Trust
- Real proof only: named testimonials with permission, real case studies, real numbers the owner can substantiate, real team and contact details.
- If proof does not exist yet, recommend honest substitutes (founder story, transparent roadmap, how it works, sample outputs, a clear policy) and a plan to collect real proof. Do NOT suggest inventing any.
- Policies visible: privacy, terms, refunds, pricing transparency.
- Security cues only where genuinely applicable.

## 7. Conversion mechanics
- Forms: only necessary fields, clear labels, inline validation, helpful errors, no surprise requirements.
- Pricing: easy to compare, no hidden fees, plain description of what is included, common objections answered (FAQ).
- Risk reversal: only offers the business will honor (trial, refund, cancel anytime).
- Microcopy: reassurance near sensitive asks (email, payment).
- Dark patterns to flag: pre-checked upsells, confirm-shaming, hidden costs, hard-to-find cancel, fake timers.

## 8. Retention and lifecycle
- Activation: define the single action that signals a user got value; shorten the path to it.
- Onboarding: checklist or guided first run; empty states that teach.
- Lifecycle messages: welcome, activation nudge, value recap, re-engagement. Each must have a real reason to exist and an easy unsubscribe.
- Habit and return triggers tied to genuine value (new relevant content, completed progress), not manufactured guilt.
- Feedback loops: in-product feedback, exit survey, support access.
- Offboarding: easy cancel, ask why, offer pause or downgrade if real, keep the door open.
- Metrics: activation rate, week-1/week-4 return, churn reasons, NPS-style feedback. Capture baselines before changing things.

## 9. Technical and performance hygiene
- Titles, meta descriptions, canonical tags, Open Graph tags, structured data where relevant.
- Heading structure, alt text, link text.
- Mobile viewport tag, obvious oversized assets, render-blocking resources visible in source.
- HTTPS, broken links, 404 page quality.
- Flag anything requiring a real speed test (Lighthouse/PageSpeed) or rendered check, and say so rather than guess.
