import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.core.database import engine
from sqlalchemy import text


async def migrate_missing():
    print("Applying missing tables migration to Supabase...")
    async with engine.begin() as conn:
        # Add optional columns if missing
        await conn.execute(text("ALTER TABLE tools ADD COLUMN IF NOT EXISTS created_by UUID;"))
        await conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;"))

        # comparisons
        await conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS comparisons (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                summary TEXT,
                status VARCHAR(50) DEFAULT 'draft' NOT NULL,
                created_by UUID,
                published_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
            );
        """
            )
        )

        # comparison_tools
        await conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS comparison_tools (
                comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
                tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
                position SMALLINT NOT NULL,
                PRIMARY KEY (comparison_id, tool_id),
                CONSTRAINT uq_comparison_tools_position UNIQUE (comparison_id, position)
            );
        """
            )
        )

        # tool_alternatives
        await conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS tool_alternatives (
                tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
                alternative_tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
                rationale TEXT,
                created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
                PRIMARY KEY (tool_id, alternative_tool_id),
                CONSTRAINT ck_tool_alternatives_not_self CHECK (tool_id <> alternative_tool_id)
            );
        """
            )
        )

        # score_history
        await conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS score_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
                score_version VARCHAR(50) NOT NULL,
                overall_score NUMERIC(5, 2) NOT NULL,
                dimension_scores JSONB NOT NULL,
                methodology_url TEXT,
                evidence JSONB DEFAULT '[]'::jsonb NOT NULL,
                calculated_at TIMESTAMPTZ NOT NULL,
                CONSTRAINT uq_score_history_tool_version_time UNIQUE (tool_id, score_version, calculated_at)
            );
        """
            )
        )
        await conn.execute(
            text(
                """
            CREATE INDEX IF NOT EXISTS ix_score_history_tool_calculated_at ON score_history (tool_id, calculated_at DESC);
        """
            )
        )
    print("Migration applied successfully!")


if __name__ == "__main__":
    asyncio.run(migrate_missing())
