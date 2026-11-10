# Implementation Plan — Phase 6: User Systems & Cognito Auth

**Official Domain:** [https://aitoolsfinder.cloud](https://aitoolsfinder.cloud)  
**Auth Provider:** AWS Cognito (User Pools + JWKS Validation)  
**Database:** PostgreSQL 16 (Supabase / Docker)  
**Status:** Queued (Depends on Phase 4 & 5)  
**Exit Criteria:** Users can sign up, sign in, save tools to their dashboard, and access protected endpoints with validated Cognito JWTs.

---

## 1. Objectives & Scope

Phase 6 implements secure user identity, authentication, and bookmarking systems. While public discovery remains completely accessible without login, users who want to bookmark tools, save comparisons, or customize recommendations can authenticate via **AWS Cognito**.

### In Scope
1. **AWS Cognito Integration & FastAPI Security (`backend/src/core/security.py`):**
   - Backend validation of Cognito JWT tokens (ID & Access tokens).
   - In-memory JWKS key caching with automatic rotation refresh.
   - Verification of `iss` (Cognito User Pool URL), `aud` (App Client ID), `exp`, and `token_use`.
2. **Internal User Mapping in PostgreSQL:**
   - `users` table keyed to stable Cognito `sub`.
   - Role-based authorization (`user`, `vendor`, `admin`) enforced in FastAPI service dependencies.
3. **Saved Tools & Preferences:**
   - `saved_tools` table (composite PK: `user_id`, `tool_id`).
   - Endpoints:
     - `GET /api/v1/users/me/saved-tools`
     - `POST /api/v1/users/me/saved-tools/{tool_id}`
     - `DELETE /api/v1/users/me/saved-tools/{tool_id}`
4. **Frontend Authentication UI (`frontend/src/app/(auth)/`):**
   - Brand-consistent authentication screens styled with Space Black and Deep Lavender.
   - Pages: `/login`, `/signup`, `/forgot-password`, `/auth/callback`.
   - PKCE flow for secure browser token exchange.
5. **User Dashboard (`frontend/src/app/(dashboard)/dashboard/`):**
   - Overview metrics (saved tools, saved comparisons).
   - Saved tools grid with remove triggers.
   - User profile settings and notification preferences.

---

## 2. Step-by-Step Task Checklist

- [ ] **Task 6.1: Database Migrations for Users & Saved Tools**
  - Create Alembic migration for `users` and `saved_tools`.
  - Add unique constraint on `users.cognito_sub`.
  - Add foreign key with cascade delete from `saved_tools` to `tools.id` and `users.id`.

- [ ] **Task 6.2: Backend Cognito Security Module (`backend/src/core/security.py`)**
  - Implement async JWKS key cache fetching from `https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json`.
  - Implement `get_current_user` and `require_role(allowed_roles)` FastAPI dependencies.
  - Implement JIT (Just-In-Time) user creation upon first valid token presentation.

- [ ] **Task 6.3: User Profile & Bookmarks Endpoints (`backend/src/modules/identity/`)**
  - `GET /api/v1/users/me`
  - `PATCH /api/v1/users/me`
  - `GET /api/v1/users/me/saved-tools` (with full tool summaries)
  - `POST /api/v1/users/me/saved-tools/{tool_id}` (idempotent save)
  - `DELETE /api/v1/users/me/saved-tools/{tool_id}`

- [ ] **Task 6.4: Frontend Auth Pages (`frontend/src/app/(auth)/`)**
  - Custom login form with email & password input.
  - Custom registration form with confirmation code verification.
  - Auth context provider (`useAuth`) managing session state and tokens.

- [ ] **Task 6.5: User Dashboard Interface (`frontend/src/app/(dashboard)/dashboard/page.tsx`)**
  - Protected dashboard layout with sidebar navigation.
  - Saved Tools tab with grid cards and quick compare actions.
  - Account settings tab to update display name and view email.

- [ ] **Task 6.6: Integration Tests & Security Validation**
  - Test JWT token validation with valid, expired, and forged tokens.
  - Test RBAC boundaries (regular user cannot access admin routes).
  - Test saved tools CRUD operations.

---

## 3. Milestone Exit Criteria

1. Users can register, confirm email, and sign in.
2. Saving a tool saves the association in PostgreSQL and updates the UI state immediately.
3. Backend strictly enforces token validity and rejects unauthorized requests with standard error envelopes.
4. User dashboard renders bookmarks cleanly with full mobile responsiveness.
