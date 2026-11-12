# Implementation Plan — Phase 7: Monetization & Submissions

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Database:** Supabase 16 (Docker)  
**Integrations:** Resend (Email), Tiun Business (Payments - Verification Gate)  
**Status:** Queued (Depends on Phase 6)  
**Exit Criteria:** Vendors can submit tools; admins can moderate and publish them; outbound affiliate clicks are tracked with disclosures; payment webhooks process idempotently.

---

## 1. Objectives & Scope

Phase 7 activates the monetization and vendor growth loops of `https://aitoolsfinder.cloud`. It establishes an editorial moderation pipeline for new tool submissions, affiliate link redirection with legal disclosures, and an idempotent payment webhook architecture.

### In Scope
1. **Vendor Submissions & Moderation Pipeline:**
   - Multi-step public submission form (`/submit`) allowing founders and vendors to submit their AI tools.
   - Database tables: `vendors` and `tool_submissions`.
   - Moderation statuses: `pending`, `under_review`, `approved`, `rejected`.
   - Admin moderation interface to inspect submitted data, edit metadata, and publish into the live catalog with one click.
   - Transactional emails via Resend confirming submission receipt and decision.
2. **Affiliate Click Tracking & Outbound Redirection:**
   - Database tables: `affiliate_links` and `outbound_clicks`.
   - Outbound redirection endpoint with open-redirect and SSRF validation (verifying destination domain against tool website).
   - Prominent affiliate disclosure notices complying with FTC guidelines.
3. **Tiun Business Payment Architecture (Verification Gate):**
   - Database tables: `payment_events` and `subscriptions`.
   - Webhook endpoint: `POST /api/v1/webhooks/tiun`.
   - Cryptographic signature verification, event deduplication on `(provider, provider_event_id)`, and idempotent processing.
   - Safeguard: Paid placements or checkout sessions remain in sandbox mode until live API credentials and refund capabilities are verified.

---

## 2. Step-by-Step Task Checklist

- [ ] **Task 7.1: Database Migrations for Monetization Tables**
  - Create Alembic migration for `vendors`, `tool_submissions`, `affiliate_links`, `outbound_clicks`, `payment_events`, `subscriptions`.
  - Add unique constraint on `(provider, provider_event_id)` for payment idempotency.
  - Add indexes: `tool_submissions (status, created_at)`, `outbound_clicks (tool_id, clicked_at)`.

- [ ] **Task 7.2: Tool Submission Form (`frontend/src/app/(public)/submit/page.tsx`)**
  - Multi-step form:
    - Step 1: Tool Name, Official Website, Tagline.
    - Step 2: Primary Category & Tags selection.
    - Step 3: Pricing model, Free tier limitations, Starting price.
    - Step 4: Submitter contact email and company relationship.
  - Client-side validation and sanitized submission.

- [ ] **Task 7.3: Backend Submissions Module (`backend/src/modules/vendor/`)**
  - `POST /api/v1/submissions`: Public or authenticated submission endpoint.
  - `GET /api/v1/admin/submissions`: Paginated list of pending submissions.
  - `POST /api/v1/admin/submissions/{id}/approve`: Atomically creates a published `tools` record and notifies vendor.
  - `POST /api/v1/admin/submissions/{id}/reject`: Sets status to rejected with feedback.

- [ ] **Task 7.4: Resend Email Integration (`backend/src/modules/notifications/`)**
  - Resend client adapter with template versioning.
  - Triggers: Submission received, Submission approved (with live canonical link), Submission rejected.

- [ ] **Task 7.5: Safe Outbound Click Tracking (`backend/src/modules/monetization/`)**
  - `GET /api/v1/outbound/{tool_id}`: Records anonymous click event and redirects (HTTP 307) to validated affiliate or official destination.
  - Open redirect guard: Ensures destination hostname matches approved tool domains.

- [ ] **Task 7.6: Tiun Business Webhook Receiver (`backend/src/modules/monetization/webhooks.py`)**
  - `POST /api/v1/webhooks/tiun`:
    - Reads raw payload and signature header.
    - Deduplicates against `payment_events` table (returns 200 OK immediately if already processed).
    - Dispatches subscription status updates inside a database transaction.

- [ ] **Task 7.7: Automated Tests & Verification**
  - Test submission moderation promotion to published tool.
  - Test open redirect protection against malicious destination URLs.
  - Test webhook idempotency by sending identical payloads twice.

---

## 3. Milestone Exit Criteria

1. Vendor submission form submits successfully and appears in the admin queue.
2. Admin approval creates a valid published tool record accessible on `https://aitoolsfinder.cloud/tools/[slug]`.
3. Outbound clicks record analytics accurately and redirect safely with `nofollow` attributes.
4. Duplicate payment webhooks are safely acknowledged without duplicate state mutations.
