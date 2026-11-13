import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.core.database import engine
from sqlalchemy import text


async def inspect_db():
    async with engine.connect() as conn:
        for table in ["tools", "tool_submissions", "pricing_plans", "vendors"]:
            res = await conn.execute(
                text(
                    f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}' ORDER BY ordinal_position"
                )
            )
            print(f"\n{table.upper()} COLUMNS:")
            for r in res.fetchall():
                print(f"  - {r[0]} ({r[1]})")


if __name__ == "__main__":
    asyncio.run(inspect_db())
