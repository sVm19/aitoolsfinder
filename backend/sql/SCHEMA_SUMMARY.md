# Database Schema Summary — AIToolsFinder

This directory contains SQL files for the AIToolsFinder database tables, generated to be compatible with **Supabase PostgreSQL 16**.

## Files

### `01_core_tables.sql`
The main schema file containing `CREATE TABLE` statements for all core database tables, including:

- **Categories** — Tool categorization taxonomy
- **Tags** — Keyword tags for tool discovery
- **Tools** — Published tool catalog with full-text search vector (`search_vector`)
- **Features** — Individual tool features
- **Pricing Plans** — Pricing tier definitions with amount in minor units
- **Tool-Category, Tool-Tag, Tool-Features** — Junction many-to-many tables
- **Users** — Authenticated user accounts with Cognito sub mapping
- **Saved Tools** — Bookmark/bookmark associations
- **Vendors** — Vendor/company profiles (Phase 7)
- **Tool Submissions** — Moderation pipeline submissions (Phase 7)
- **Tool Submissions Tags/Features** — Association tables for submissions
- **Affiliate Links** — Tracked affiliate links (Phase 7)
- **Outbound Clicks** — Click analytics (Phase 7)
- **Payment Events** — Tiun Business webhook events (Phase 7)
- **Subscriptions** — Recurring payment subscriptions (Phase 7)

## Design Notes

### Extensions Enabled
- `uuid-ossp` — UUID generation
- `pg_trgm` — Trigram support for fuzzy matching and autocomplete

### Key Conventions
- **Primary Keys**: UUID v4 via `uuid_generate_v4()`
- **Timestamps**: UTC `timestamptz` with `timezone('utc', now())` default
- **Currencies**: Stored as `amount_minor` (e.g., `2900` = $29.00) with 3-char ISO `currency` code
- **Slugs**: Lowercase with hyphens, unique constraints
- **Soft Delete**: No hard deletes — foreign keys use `ON DELETE CASCADE` or `SET NULL`

### Full-Text Search
The `tools` table has a **generated `TSVECTOR` search vector** column that combines:
- `name` (weight A)
- `tagline` (weight B)
- `description` (weight C)
- `primary_category_id` (weight B)

A **GIN index** on `search_vector` enables sub-10ms full-text queries with `ts_rank_cd` ranking.

### Trigram Indexes
`pg_trgm` GIN indexes on `name`, `slug`, and `search_vector` columns provide typo tolerance and autocomplete suggestions.

### Idempotency
- `payment_events` has a **unique constraint on `(provider, provider_event_id)`** for deduplication
- `affiliate_links` has a **unique constraint on `(tool_id, provider)`**
- `tool_submissions.tool_slug` has a **unique constraint**

### Relationships
- Foreign keys use `ON DELETE CASCADE` for dependent records
- `ON DELETE SET NULL` for optional references (categories, features)
- Many-to-many relationships via junction tables

## Usage

To apply the schema to a Supabase project:

```bash
psql "postgresql://postgres.YOUR-SUPABASE-PROJECT:5432/postgres?ssl=require" -f ./backend/sql/01_core_tables.sql
```

Or individual tables can be applied as needed. The schema is idempotent — running it multiple times is safe due to `IF NOT EXISTS`.

## Migration Note

This schema corresponds to **Alembic migration `0005_monetization_tables.py`** which creates the same tables via SQLAlchemy. The SQL file provides raw SQL for direct database manipulation, code-free schema reviews, or backup purposes.