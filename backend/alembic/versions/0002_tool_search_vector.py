"""Add weighted full-text and trigram indexes for tool discovery.

Revision ID: 0002_tool_search
Revises: 0001_catalog
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_tool_search"
down_revision: Union[str, None] = "0001_catalog"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pg_trgm is enabled by the initial catalog migration. Keep this safe for
    # databases that were created outside that migration path.
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')
    op.add_column(
        "tools",
        sa.Column(
            "search_vector",
            postgresql.TSVECTOR(),
            server_default=sa.text("''::tsvector"),
            nullable=False,
        ),
    )

    op.execute(
        """
        CREATE FUNCTION update_tool_search_vector() RETURNS trigger AS $$
        DECLARE
            category_name text;
        BEGIN
            SELECT name INTO category_name
            FROM categories
            WHERE id = NEW.primary_category_id;

            NEW.search_vector :=
                setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(NEW.tagline, '')), 'B') ||
                setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
                setweight(to_tsvector('english', coalesce(category_name, '')), 'B');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER tools_search_vector_update
        BEFORE INSERT OR UPDATE OF name, tagline, description, primary_category_id, search_vector
        ON tools
        FOR EACH ROW EXECUTE FUNCTION update_tool_search_vector();
        """
    )
    # Rebuild related vectors when a category label changes.
    op.execute(
        """
        CREATE FUNCTION refresh_tools_for_category_name() RETURNS trigger AS $$
        BEGIN
            UPDATE tools
            SET search_vector = search_vector
            WHERE primary_category_id = NEW.id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER categories_search_vector_refresh
        AFTER UPDATE OF name ON categories
        FOR EACH ROW WHEN (OLD.name IS DISTINCT FROM NEW.name)
        EXECUTE FUNCTION refresh_tools_for_category_name();
        """
    )

    # Fire the BEFORE trigger for existing rows so every vector includes the
    # current category name before the GIN index is built.
    op.execute("UPDATE tools SET name = name")
    op.create_index(
        "ix_tools_search_vector",
        "tools",
        ["search_vector"],
        postgresql_using="gin",
    )
    op.create_index(
        "ix_tools_name_trgm",
        "tools",
        ["name"],
        postgresql_using="gin",
        postgresql_ops={"name": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_index("ix_tools_name_trgm", table_name="tools")
    op.drop_index("ix_tools_search_vector", table_name="tools")
    op.execute("DROP TRIGGER IF EXISTS categories_search_vector_refresh ON categories")
    op.execute("DROP FUNCTION IF EXISTS refresh_tools_for_category_name()")
    op.execute("DROP TRIGGER IF EXISTS tools_search_vector_update ON tools")
    op.execute("DROP FUNCTION IF EXISTS update_tool_search_vector()")
    op.drop_column("tools", "search_vector")
