# UI/UX Guidelines

## 1. Product experience
The interface should feel like a premium, fast, trustworthy intelligence product. The user should understand what the platform does immediately and reach relevant tools with minimal friction.

## 2. Primary navigation
Desktop:
- Brand/logo
- Explore
- Categories
- Rankings
- Compare
- Submit a Tool
- Search
- Sign in / profile

Mobile:
- Compact header
- Search entry point
- Accessible navigation drawer
- Prioritize Explore, Categories, Compare and Saved Tools

Keep navigation consistent across public pages. Dashboard navigation is separate.

## 3. Homepage order
1. Navbar
2. Hero headline and natural-language search
3. Popular category shortcuts
4. Trending tools
5. Curated rankings
6. Popular comparisons
7. AI Finder explanation/entry point
8. Recently added tools
9. Editorial content
10. Vendor submission CTA
11. Footer

Do not turn the homepage into an unfiltered list of every tool.

## 4. Core page templates
- Homepage
- Explore/search results
- Category landing page
- Tag landing page
- Tool detail page
- Comparison page
- Alternatives page
- Ranking page
- AI Finder
- Editorial article
- Submit tool
- Authentication
- User dashboard
- Vendor dashboard (later)
- Admin interface (internal)

## 5. Tool card
A tool card should show:
- Logo or fallback icon
- Name
- Short factual tagline
- Primary category
- Pricing label if known
- Verified marker only when verified
- Score only if score methodology exists
- Save action
- Compare action
- Sponsored label where applicable

Cards must have consistent heights, clear focus states and clickable targets. Do not show fabricated ratings or review counts.

## 6. Tool detail page
Recommended order:
1. Breadcrumbs
2. Tool identity and short description
3. Primary outbound action
4. Summary facts and pricing
5. Overview
6. Key features
7. Use cases and audience fit
8. Pricing plans
9. Intelligence score and methodology
10. Alternatives
11. Comparisons
12. Reviews (when available)
13. FAQ (when useful and factual)
14. Data source and last verified date

## 7. Search UX
- Search should be easy to access globally.
- Debounce requests.
- Show recent/popular queries only when based on real data.
- Support keyboard navigation and clear focus.
- Preserve filters in URL query parameters.
- Provide useful empty states and reset filters.
- Do not require login to search.

## 8. User dashboard
Initial scope:
- Overview
- Saved tools
- Saved comparisons
- Preferences
- Account settings
- Billing when paid plans exist

Ask for registration only when a user tries to save or personalize.

## 9. Interaction states
Every interactive component needs:
- Default
- Hover
- Focus-visible
- Active
- Disabled
- Loading
- Success
- Error
- Empty state where relevant

## 10. Accessibility
- Semantic HTML and landmarks.
- Keyboard-operable menus, dialogs and search.
- Visible focus indicators.
- Accessible labels and error messages.
- Adequate contrast.
- Respect `prefers-reduced-motion`.
- Do not communicate state through color alone.

## 11. Motion and 3D
- Use GSAP for purposeful transitions, not constant movement.
- Use Three.js only in selected hero or showcase areas.
- Lazy-load 3D code and assets.
- Provide static fallback for low-powered devices and reduced-motion preferences.
- Avoid blocking LCP with WebGL.
- Clean up GSAP timelines, event listeners and WebGL resources on unmount.

## 12. Responsive behavior
Design mobile-first. Test at narrow mobile, standard mobile, tablet, laptop and wide desktop sizes. Tables should become stacked comparisons or horizontally scrollable with clear affordances.
