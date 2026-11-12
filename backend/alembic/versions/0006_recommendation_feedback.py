"""Add recommendation feedback table for Phase 5.

Revision ID: 0006_recommendation_feedback
Revises: 0005_monetization_tables
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0006_recommendation_feedback"
down_revision: Union[str, None] = "0005_monetization_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recommendation_feedback",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "tool_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tools.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("query", postgresql.Text, nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", postgresql.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "rating BETWEEN 1 AND 5", name="ck_recommendation_feedback_rating"
        ),
    )
    op.create_index(
        "ix_recommendation_feedback_tool_created",
        "recommendation_feedback",
        ["tool_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_recommendation_feedback_tool_created",
        table_name="recommendation_feedback",
    )
    op.drop_table("recommendation_feedback")
