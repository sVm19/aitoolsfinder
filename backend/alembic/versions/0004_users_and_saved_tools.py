"""Add users and saved_tools tables for Phase 6 authentication system.

Revision ID: 0004_users_and_saved_tools
Revises: 0003_intelligence
Branch Labels: None
Depends On: None
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_users_and_saved_tools"
down_revision: Union[str, None] = "0003_intelligence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users table ---

    op.create_table(
        "users",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True,
            server_default=sa.text("gen_random_uuid()")
        ),
        sa.Column("cognito_sub", postgresql.String(128), nullable=False,
                  unique=True,
                  index=True,
                  comment="Stable Cognito User Pool sub identifier")
        ,
        sa.Column("email", postgresql.String(254), nullable=False,
                  unique=True,
                  index=True,
                  comment="User email address")
        ,
        sa.Column("display_name", postgresql.String(128), nullable=True,
                  comment="Display name shown in dashboard")
        ,
        sa.Column("role", postgresql.String(20), nullable=False,
                  server_default="user",
                  comment="Role: user | vendor | admin")
        ,
        sa.Column("is_email_verified", sa.Boolean(), nullable=False,
                  server_default=sa.false(),
                  comment="Email verification status")
        ,
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False)
        ,
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False)
        ,
        sa.UniqueConstraint("cognito_sub", name="uq_users_cognito_sub"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    # --- saved_tools table (bookmarks) ---

    op.create_table(
        "saved_tools",
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
            comment="FK to users.id"
        ),
        sa.Column(
            "tool_id", postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tools.id", ondelete="CASCADE"),
            primary_key=True,
            comment="FK to tools.id"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("timezone('utc', now())"), nullable=False)
        ,
        sa.UniqueConstraint(
            "user_id", "tool_id", name="uq_saved_tools_user_tool"
        ),
    )


def downgrade() -> None:
    op.drop_table("saved_tools")
    op.drop_table("users")
