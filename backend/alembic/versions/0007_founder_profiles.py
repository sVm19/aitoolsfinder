"""Add founder profiles and link vendors to users.

Revision ID: 0007_founder_profiles
Revises: 0006_recommendation_feedback
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0007_founder_profiles"
down_revision: Union[str, None] = "0006_recommendation_feedback"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create founder_profiles table
    op.create_table(
        "founder_profiles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
            comment="1-to-1 link to users.id",
        ),
        sa.Column("founder_name", sa.String(128), nullable=False),
        sa.Column("handle", sa.String(64), nullable=False, unique=True),
        sa.Column("headline", sa.String(160), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("substack_url", sa.String(255), nullable=True),
        sa.Column("x_url", sa.String(255), nullable=True),
        sa.Column("linkedin_url", sa.String(255), nullable=True),
        sa.Column("github_url", sa.String(255), nullable=True),
        sa.Column("reddit_url", sa.String(255), nullable=True),
        sa.Column("instagram_url", sa.String(255), nullable=True),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
            comment="Verification badge awarded status",
        ),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", name="uq_founder_profiles_user_id"),
        sa.UniqueConstraint("handle", name="uq_founder_profiles_handle"),
    )

    op.create_index(
        "ix_founder_profiles_user_id",
        "founder_profiles",
        ["user_id"],
    )
    op.create_index(
        "ix_founder_profiles_handle",
        "founder_profiles",
        ["handle"],
    )
    op.create_index(
        "ix_founder_profiles_is_verified",
        "founder_profiles",
        ["is_verified"],
    )

    # 2. Add user_id to vendors table
    op.add_column(
        "vendors",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            comment="FK to authenticated user owning this vendor entity",
        ),
    )
    op.create_index("ix_vendors_user_id", "vendors", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_vendors_user_id", table_name="vendors")
    op.drop_column("vendors", "user_id")

    op.drop_index("ix_founder_profiles_is_verified", table_name="founder_profiles")
    op.drop_index("ix_founder_profiles_handle", table_name="founder_profiles")
    op.drop_index("ix_founder_profiles_user_id", table_name="founder_profiles")
    op.drop_table("founder_profiles")
