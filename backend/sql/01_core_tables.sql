-- ============================================================
-- Core Database Tables for AIToolsFinder
-- ============================================================
-- Supabase PostgreSQL 16 compatible
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- Categories table
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    seo_title VARCHAR(255),
    seo_description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Index for slug lookups and trigrams for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories USING gin (name gin_trgm_ops);

-- ============================================================
-- Tags table
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) UNIQUE NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Index for slug lookups and trigrams for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags USING gin (name gin_trgm_ops);

-- ============================================================
-- Tools table (published tools catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(500) NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    logo_object_key VARCHAR(255),
    primary_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    pricing_model VARCHAR(50) DEFAULT 'free',
    platform_status VARCHAR(50) DEFAULT 'active',
    is_verified BOOLEAN DEFAULT FALSE,
    is_sponsored BOOLEAN DEFAULT FALSE,
    launched_at DATE,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Search vector for full-text search
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED
);

-- Full-text search and trigram indexes
CREATE INDEX IF NOT EXISTS idx_tools_search_vector ON tools USING gin (search_vector);
CREATE INDEX IF NOT EXISTS idx_tools_name_trgm ON tools USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(platform_status);
CREATE INDEX IF NOT EXISTS idx_tools_verified ON tools(is_verified);

-- ============================================================
-- Features table
-- ============================================================
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ============================================================
-- Pricing plans table
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount_minor BIGINT NOT NULL,  -- stored as cents (e.g., 2900 = $29.00)
    currency CHAR(3) DEFAULT 'USD',
    billing_interval VARCHAR(50) DEFAULT 'monthly',
    is_free BOOLEAN DEFAULT TRUE,
    source_url VARCHAR(500),
    limitations JSONB DEFAULT '{}',
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Index for pricing queries
    CONSTRAINT chk_amount_positive CHECK (amount_minor >= 0)
);

-- Index for pricing model queries
CREATE INDEX IF NOT EXISTS idx_pricing_plans_tool_id ON pricing_plans(tool_id);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_currency ON pricing_plans(currency);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_is_free ON pricing_plans(is_free);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_billing ON pricing_plans(billing_interval);

-- ============================================================
-- Tool-Category junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_categories (
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, category_id)
);

-- Index for category queries
CREATE INDEX IF NOT EXISTS idx_tool_categories_tool ON tool_categories(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_categories_cat ON tool_categories(category_id);

-- ============================================================
-- Tool-Tags junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_tags (
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, tag_id)
);

-- Index for tag queries
CREATE INDEX IF NOT EXISTS idx_tool_tags_tool ON tool_tags(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tag ON tool_tags(tag_id);

-- ============================================================
-- Tool-Features junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_features (
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, feature_id)
);

-- Index for feature queries
CREATE INDEX IF NOT EXISTS idx_tool_features_tool ON tool_features(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_features_feature ON tool_features(feature_id);

-- ============================================================
-- Users table (for auth/system users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_sub VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    display_name VARCHAR(128),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'vendor', 'admin')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Unique constraints
    CONSTRAINT uq_users_cognito_sub UNIQUE (cognito_sub),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- Saved tools / bookmarks table
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_tools (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    PRIMARY KEY (user_id, tool_id)
);

-- Index for bookmark queries
CREATE INDEX IF NOT EXISTS idx_saved_tools_user ON saved_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_tools_tool ON saved_tools(tool_id);

-- ============================================================
-- Vendors table (for Phase 7 monetization)
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Unique constraints
    CONSTRAINT uq_vendors_email UNIQUE (email)
);

-- Index for vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(is_verified);

-- ============================================================
-- Tool Submissions table (for Phase 7 moderation)
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    tool_name VARCHAR(255) NOT NULL,
    tool_slug VARCHAR(128) UNIQUE NOT NULL,
    tagline VARCHAR(500) NOT NULL,
    description TEXT,
    primary_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    pricing_model VARCHAR(50) DEFAULT 'free',
    is_free BOOLEAN DEFAULT TRUE,
    starting_price_minor INTEGER,  -- in cents
    currency CHAR(3) DEFAULT 'USD',
    website_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT chk_unique_slug UNIQUE (tool_slug)
);

-- Index for submission queries
CREATE INDEX IF NOT EXISTS idx_tool_submissions_status ON tool_submissions(status);
CREATE INDEX IF NOT EXISTS idx_tool_submissions_vendor ON tool_submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tool_submissions_created ON tool_submissions(created_at);

-- ============================================================
-- Tool Submissions Tags junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_submissions_tags (
    tool_submission_id UUID NOT NULL REFERENCES tool_submissions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE SET NULL,
    PRIMARY KEY (tool_submission_id, tag_id)
);

-- Index for tag queries
CREATE INDEX IF NOT EXISTS idx_submissions_tags_sub ON tool_submissions_tags(tool_submission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_tags_tag ON tool_submissions_tags(tag_id);

-- ============================================================
-- Tool Submissions Features junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_submission_features (
    tool_submission_id UUID NOT NULL REFERENCES tool_submissions(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE SET NULL,
    PRIMARY KEY (tool_submission_id, feature_id)
);

-- Index for feature queries
CREATE INDEX IF NOT EXISTS idx_submission_features_sub ON tool_submission_features(tool_submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_features_feature ON tool_submission_features(feature_id);

-- ============================================================
-- Affiliate Links table (for Phase 7 tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    provider VARCHAR(100) DEFAULT 'resend' NOT NULL,
    provider_url VARCHAR(500) NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Constraints
    CONSTRAINT uq_affiliate_tool_provider UNIQUE (tool_id, provider)
);

-- Index for affiliate queries
CREATE INDEX IF NOT EXISTS idx_affiliate_links_tool ON affiliate_links(tool_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_provider ON affiliate_links(provider);

-- ============================================================
-- Outbound Clicks table (for Phase 7 analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS outbound_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Index for click analytics
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_tool ON outbound_clicks(tool_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_clicked ON outbound_clicks(clicked_at);

-- ============================================================
-- Payment Events table (for Phase 7 Tiun webhooks)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) DEFAULT 'tiun' NOT NULL,
    provider_event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(50) DEFAULT 'subscription_created' NOT NULL,
    status VARCHAR(20) DEFAULT 'processed' CHECK (status IN ('processed', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Unique constraint for idempotency: one record per (provider, provider_event_id)
    CONSTRAINT uq_payment_events_dedup UNIQUE (provider, provider_event_id)
);

-- Index for payment queries
CREATE INDEX IF NOT EXISTS idx_payment_events_provider ON payment_events(provider);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events(created_at);

-- ============================================================
-- Subscriptions table (for Phase 7 recurring payments)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_subscription_id VARCHAR(128) NOT NULL,  -- ID from the payment provider
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'completed')),
    pricing_plan_id UUID REFERENCES pricing_plans(id) ON DELETE SET NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),

    -- Constraints
    CONSTRAINT uq_subscription_provider_id UNIQUE (provider_subscription_id)
);

-- Index for subscription queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider ON subscriptions(provider_subscription_id);