# Database Schema Specification

## 1. Conventions
- PostgreSQL.
- UUID primary keys (`gen_random_uuid()`).
- `created_at` and `updated_at` timestamps in UTC.
- Use `timestamptz`.
- Store money as integer minor units plus ISO currency code; never use floating point for money.
- Use foreign keys and explicit delete behavior.
- Add indexes based on actual query patterns.
- Use Alembic migrations as the schema source of truth.
- Cognito identity is external; store its stable `sub` in the internal user table.

## 2. Core tables

### users
- id UUID PK
- cognito_sub VARCHAR UNIQUE NOT NULL
- email VARCHAR
- display_name VARCHAR
- role VARCHAR NOT NULL DEFAULT 'user' (`user`, `vendor`, `admin`)
- status VARCHAR NOT NULL DEFAULT 'active'
- created_at, updated_at

### tools
- id UUID PK
- name VARCHAR NOT NULL
- slug VARCHAR UNIQUE NOT NULL
- tagline VARCHAR
- description TEXT
- website_url TEXT
- logo_object_key TEXT
- primary_category_id UUID FK categories.id NULL
- pricing_model VARCHAR (`free`, `freemium`, `paid`, `usage_based`, `contact_sales`, `unknown`)
- platform_status VARCHAR (`draft`, `pending_review`, `published`, `rejected`, `archived`)
- is_verified BOOLEAN DEFAULT false
- is_sponsored BOOLEAN DEFAULT false
- launched_at DATE NULL
- last_verified_at TIMESTAMPTZ NULL
- created_by UUID FK users.id NULL
- created_at, updated_at

### categories
- id UUID PK
- parent_id UUID FK categories.id NULL
- name VARCHAR NOT NULL
- slug VARCHAR UNIQUE NOT NULL
- description TEXT
- seo_title VARCHAR NULL
- seo_description VARCHAR NULL
- is_active BOOLEAN DEFAULT true
- sort_order INTEGER DEFAULT 0
- created_at, updated_at

### tags
- id UUID PK
- name VARCHAR UNIQUE NOT NULL
- slug VARCHAR UNIQUE NOT NULL
- created_at

### tool_categories
- tool_id UUID FK tools.id
- category_id UUID FK categories.id
- PRIMARY KEY (tool_id, category_id)

### tool_tags
- tool_id UUID FK tools.id
- tag_id UUID FK tags.id
- PRIMARY KEY (tool_id, tag_id)

### features
- id UUID PK
- name VARCHAR NOT NULL
- slug VARCHAR UNIQUE NOT NULL
- description TEXT NULL
- feature_group VARCHAR NULL

### tool_features
- tool_id UUID FK tools.id
- feature_id UUID FK features.id
- support_level VARCHAR (`yes`, `partial`, `no`, `unknown`)
- evidence_url TEXT NULL
- notes TEXT NULL
- PRIMARY KEY (tool_id, feature_id)

### pricing_plans
- id UUID PK
- tool_id UUID FK tools.id
- name VARCHAR NOT NULL
- description TEXT NULL
- amount_minor BIGINT NULL
- currency CHAR(3) NULL
- billing_interval VARCHAR (`one_time`, `monthly`, `yearly`, `usage_based`, `unknown`)
- is_free BOOLEAN DEFAULT false
- pricing_url TEXT NULL
- limitations JSONB DEFAULT '{}'
- source_url TEXT NULL
- last_verified_at TIMESTAMPTZ NULL
- created_at, updated_at

### tool_alternatives
- tool_id UUID FK tools.id
- alternative_tool_id UUID FK tools.id
- rationale TEXT NULL
- created_at
- PRIMARY KEY (tool_id, alternative_tool_id)
- CHECK tool_id <> alternative_tool_id

### comparisons
- id UUID PK
- slug VARCHAR UNIQUE NOT NULL
- title VARCHAR NOT NULL
- summary TEXT NULL
- status VARCHAR (`draft`, `published`, `archived`)
- created_by UUID FK users.id NULL
- published_at TIMESTAMPTZ NULL
- created_at, updated_at

### comparison_tools
- comparison_id UUID FK comparisons.id
- tool_id UUID FK tools.id
- position SMALLINT NOT NULL
- PRIMARY KEY (comparison_id, tool_id)
- UNIQUE (comparison_id, position)

### score_history
- id UUID PK
- tool_id UUID FK tools.id
- score_version VARCHAR NOT NULL
- overall_score NUMERIC(5,2) NOT NULL
- dimension_scores JSONB NOT NULL
- methodology_url TEXT NULL
- evidence JSONB DEFAULT '[]'
- calculated_at TIMESTAMPTZ NOT NULL
- UNIQUE (tool_id, score_version, calculated_at)

### reviews
- id UUID PK
- tool_id UUID FK tools.id
- user_id UUID FK users.id
- rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5)
- title VARCHAR NULL
- body TEXT NULL
- moderation_status VARCHAR DEFAULT 'pending'
- created_at, updated_at
- UNIQUE (tool_id, user_id)

### saved_tools
- user_id UUID FK users.id
- tool_id UUID FK tools.id
- created_at
- PRIMARY KEY (user_id, tool_id)

### vendors
- id UUID PK
- user_id UUID FK users.id
- company_name VARCHAR NOT NULL
- website_url TEXT
- verification_status VARCHAR DEFAULT 'pending'
- created_at, updated_at

### tool_submissions
- id UUID PK
- vendor_id UUID FK vendors.id NULL
- submitted_name VARCHAR NOT NULL
- submitted_url TEXT NOT NULL
- submitted_data JSONB NOT NULL
- status VARCHAR DEFAULT 'pending'
- moderation_notes TEXT NULL
- reviewed_by UUID FK users.id NULL
- reviewed_at TIMESTAMPTZ NULL
- created_at, updated_at

### affiliate_links
- id UUID PK
- tool_id UUID FK tools.id
- destination_url TEXT NOT NULL
- network_name VARCHAR NULL
- tracking_code VARCHAR NULL
- disclosure_required BOOLEAN DEFAULT true
- is_active BOOLEAN DEFAULT true
- created_at, updated_at

### outbound_clicks
- id UUID PK
- tool_id UUID FK tools.id
- affiliate_link_id UUID FK affiliate_links.id NULL
- user_id UUID FK users.id NULL
- anonymous_session_id VARCHAR NULL
- referrer_path TEXT NULL
- clicked_at TIMESTAMPTZ NOT NULL

### payment_events
- id UUID PK
- provider VARCHAR NOT NULL
- provider_event_id VARCHAR NOT NULL
- event_type VARCHAR NOT NULL
- payload JSONB NOT NULL
- processing_status VARCHAR NOT NULL DEFAULT 'received'
- processed_at TIMESTAMPTZ NULL
- created_at
- UNIQUE (provider, provider_event_id)

### subscriptions
- id UUID PK
- user_id UUID FK users.id
- provider VARCHAR NOT NULL
- provider_customer_id VARCHAR NULL
- provider_subscription_id VARCHAR UNIQUE NULL
- status VARCHAR NOT NULL
- current_period_start TIMESTAMPTZ NULL
- current_period_end TIMESTAMPTZ NULL
- created_at, updated_at

### audit_logs
- id UUID PK
- actor_user_id UUID FK users.id NULL
- action VARCHAR NOT NULL
- entity_type VARCHAR NOT NULL
- entity_id UUID NULL
- metadata JSONB DEFAULT '{}'
- created_at

## 3. Important indexes
- tools: unique slug; status + updated_at; primary_category_id; pricing_model
- categories: unique slug; parent_id + sort_order
- tags: unique slug
- pricing_plans: tool_id + is_free
- score_history: tool_id + calculated_at DESC
- reviews: tool_id + moderation_status
- outbound_clicks: tool_id + clicked_at DESC
- payment_events: unique provider/event ID and processing_status
- submissions: status + created_at

## 4. Search
Start with PostgreSQL full-text search. Add a generated/search vector or maintained `tsvector` for tool name, tagline, description and category text. Add GIN index. Use `pg_trgm` for typo-tolerant matching if enabled.

## 5. Data integrity and security
- Published tools require a name, slug, description or meaningful summary, official URL and at least one category.
- Validate URLs and normalize domains.
- Never store raw card data.
- Do not store Cognito passwords.
- Keep payment webhook payloads access-controlled and redact secrets where possible.
- Restrict write access to admin/vendor-owned records.
- Add row-level security only if the selected database deployment and access pattern support it correctly; do not assume RLS replaces backend authorization.

## 6. Taxonomy seed data
Use the supplied `categories(1).txt` and `Tags(1).txt` as the initial source lists. Import them through repeatable seed scripts. Normalize whitespace and slug format, but preserve original display names. Review duplicates and ambiguous entries before publishing. The lists are starting taxonomy data, not a final hierarchy.

## 7. Migration policy
Every schema change must have an Alembic migration. Never edit production schema manually. Test upgrade and downgrade behavior where practical.
