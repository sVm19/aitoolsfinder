"""Add monetization and submission tables for Phase 7."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_monetization_tables"
down_revision: Union[str, None] = "0004_users_and_saved_tools"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- vendors table ---

    op.create_table(
        "vendors",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column("name", postgresql.String(254), nullable=False),
        sa.Column("email", postgresql.String(254), nullable=False),
        sa.Column("description", postgresql.Text, nullable=True),
        sa.Column("website_url", postgresql.String(500), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False,
                  server_default=sa.false(),
                  comment="Vendor verification status"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.UniqueConstraint("email", name="uq_vendors_email"),
    )

    # --- tool_submissions table ---

    op.create_table(
        "tool_submissions",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column("vendor_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tool_name", postgresql.String(254), nullable=False),
        sa.Column("tool_slug", postgresql.String(128), nullable=False),
        sa.Column("tagline", postgresql.String(500), nullable=False),
        sa.Column("description", postgresql.Text, nullable=True),
        sa.Column("primary_category_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pricing_model", postgresql.String(50), nullable=False,
                  server_default="free",
                  comment="Pricing model: free, freemium, paid, one-time, custom"),
        sa.Column("is_free", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("starting_price_minor", sa.Integer(), nullable=True),
        sa.Column("currency", postgresql.String(3), nullable=False,
                  server_default="USD",
                  comment="ISO 4217 currency code"),
        sa.Column("website_url", postgresql.String(500), nullable=True),
        sa.Column("status", postgresql.String(20), nullable=False,
                  server_default="pending",
                  comment="pending | under_review | approved | rejected"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.UniqueConstraint("tool_slug", name="uq_tool_submissions_slug"),
    )

    # --- tool_submissions_tags association table ---

    op.create_table(
        "tool_submissions_tags",
        sa.Column(
            "tool_submission_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tool_submissions.id", ondelete="CASCADE"),
            primary_key=True
        ),
        sa.Column("tag_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tags.id", ondelete="SET NULL"), nullable=True),
        sa.UniqueConstraint(
            "tool_submission_id", "tag_id", name="uq_submissions_tags"
        ),
    )

    # --- tool_submission_features association table ---

    op.create_table(
        "tool_submission_features",
        sa.Column(
            "tool_submission_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tool_submissions.id", ondelete="CASCADE"),
            primary_key=True
        ),
        sa.Column("feature_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("features.id", ondelete="SET NULL"), nullable=True),
        sa.UniqueConstraint(
            "tool_submission_id", "feature_id", name="uq_submissions_features"
        ),
    )

    # --- affiliate_links table ---

    op.create_table(
        "affiliate_links",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column("tool_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", postgresql.String(100), nullable=False,
                  server_default="resend",
                  comment="Affiliate provider: resend, tiun, etc."),
        sa.Column("provider_url", postgresql.String(500), nullable=False),
        sa.Column("is_approved", sa.Boolean(), nullable=False,
                  server_default=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
    )

    # --- outbound_clicks table ---

    op.create_table(
        "outbound_clicks",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column("tool_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("tools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("clicked_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column("ip_address", postgresql.String(45), nullable=True),
        sa.Column("user_agent", postgresql.Text, nullable=True),
    )

    # --- payment_events table ---

    op.create_table(
        "payment_events",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column("provider", postgresql.String(50), nullable=False,
                  server_default="tiun",
                  comment="Payment provider: tiun, stripe, etc."),
        sa.Column("provider_event_id", postgresql.String(128), nullable=False),
        sa.Column("event_type", postgresql.String(50), nullable=False,
                  server_default="subscription_created",
                  comment="subscription_created, subscription_updated, subscription_cancelled"),
        sa.Column("status", postgresql.String(20), nullable=False,
                  server_default="processed",
                  comment="processed | completed | failed"),
        sa.Column("metadata", postgresql.JSONB(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.UniqueConstraint(
            "provider", "provider_event_id", name="uq_payment_events_dedup"
        ),
    )

    # --- subscriptions table ---

    op.create_table(
        "subscriptions",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider_subscription_id", postgresql.String(128), nullable=False),
        sa.Column("status", postgresql.String(20), nullable=False,
                  server_default="active",
                  comment="active | cancelled | past_due | completed"),
        sa.Column("pricing_plan_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("pricing_plans.id", ondelete="SET NULL"), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False,
                  server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("subscriptions")
    op.drop_table("payment_events")
    op.drop_table("outbound_clicks")
    op.drop_table("affiliate_links")
    op.drop_table("tool_submission_features")
    op.drop_table("tool_submissions_tags")
    op.drop_table("tool_submissions")
    op.drop_table("vendors")
