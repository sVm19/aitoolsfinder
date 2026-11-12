from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
import uuid

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.catalog.models import ToolModel
from src.modules.intelligence.models import ToolAlternativeModel
from src.modules.intelligence.scoring import calculate_tool_score


def test_score_is_deterministic_and_uses_decimal_precision():
    as_of = datetime(2026, 11, 11, tzinfo=timezone.utc)
    tool = SimpleNamespace(
        features=[
            SimpleNamespace(support_level="yes"),
            SimpleNamespace(support_level="partial"),
        ],
        pricing_plans=[
            SimpleNamespace(
                is_free=True,
                amount_minor=None,
                billing_interval="monthly",
                pricing_url="https://example.test/pricing",
                source_url=None,
            )
        ],
        is_verified=True,
        last_verified_at=as_of - timedelta(days=10),
    )

    first = calculate_tool_score(tool, as_of=as_of)
    second = calculate_tool_score(tool, as_of=as_of)

    assert first == second
    assert first.dimension_scores["feature_breadth"] == Decimal("75.00")
    assert first.dimension_scores["pricing_transparency"] == Decimal("100.00")
    assert first.overall_score == Decimal("90.63")
    assert isinstance(first.overall_score, Decimal)
    assert first.available_weight_percent == Decimal("80")


@pytest.mark.asyncio
async def test_tool_cannot_be_its_own_alternative(db_session: AsyncSession):
    tool_id = uuid.uuid4()
    db_session.add(
        ToolModel(
            id=tool_id,
            name="Constraint fixture",
            slug=f"constraint-{tool_id}",
            website_url="https://example.test",
        )
    )
    db_session.add(
        ToolAlternativeModel(tool_id=tool_id, alternative_tool_id=tool_id)
    )

    with pytest.raises(IntegrityError):
        await db_session.flush()

    await db_session.rollback()
