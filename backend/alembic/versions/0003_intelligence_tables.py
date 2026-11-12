"""Add comparison, alternatives, and score history tables.

Revision ID: 0003_intelligence
Revises: 0002_tool_search
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0003_intelligence"
down_revision: Union[str, None] = "0002_tool_search"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comparisons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column(
            "status", sa.String(50), server_default="draft", nullable=False
        ),
        # The users table is introduced in Phase 6; Phase 6 will add its FK.
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.UniqueConstraint("slug", name="uq_comparisons_slug"),
    )
    # The unique constraint creates the btree index used for slug lookups.

    op.create_table(
        "comparison_tools",
        sa.Column(
            "comparison_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("comparisons.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tool_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tools.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.UniqueConstraint(
            "comparison_id", "position", name="uq_comparison_tools_position"
        ),
    )

    op.create_table(
        "tool_alternatives",
        sa.Column(
            "tool_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tools.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "alternative_tool_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tools.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "tool_id <> alternative_tool_id", name="ck_tool_alternatives_not_self"
        ),
    )

    op.create_table(
        "score_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tool_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tools.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("score_version", sa.String(50), nullable=False),
        sa.Column("overall_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("dimension_scores", postgresql.JSONB(), nullable=False),
        sa.Column("methodology_url", sa.Text(), nullable=True),
        sa.Column(
            "evidence",
            postgresql.JSONB(),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "calculated_at", sa.DateTime(timezone=True), nullable=False
        ),
        sa.UniqueConstraint(
            "tool_id",
            "score_version",
            "calculated_at",
            name="uq_score_history_tool_version_time",
        ),
    )
    op.create_index(
        "ix_score_history_tool_calculated_at",
        "score_history",
        ["tool_id", sa.text("calculated_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("ix_score_history_tool_calculated_at", table_name="score_history")
    op.drop_table("score_history")
    op.drop_table("tool_alternatives")
    op.drop_table("comparison_tools")
    op.drop_table("comparisons")
