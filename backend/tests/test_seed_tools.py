"""TDD tests for Part 3: backend/scripts/seed_tools.py."""

import json
import sys
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import seed_tools  # noqa: E402


class TestRecordNormalization:
    def test_rejects_unsafe_url_and_normalizes_valid_record(self):
        assert seed_tools.normalize_record({"name": "Bad", "website_url": "ftp://bad.com"}) is None
        assert seed_tools.normalize_record({"name": "Bad", "website_url": "https://u:p@bad.com"}) is None

        rec = seed_tools.normalize_record(
            {
                "name": "Amplitude",
                "slug": "amplitude",
                "website_url": "https://amplitude.com",
                "tagline": "Product analytics",
                "description": "Analytics platform.",
                "primary_category_slug": "analytics",
                "tag_slugs": ["analytics", "ai"],
                "pricing_model": "freemium",
                "pricing_plans": [
                    {"name": "Free", "is_free": True, "amount_minor": 0, "billing_interval": "monthly"}
                ],
                "features": ["Session Replay", "Heatmaps"],
            }
        )
        assert rec is not None
        assert rec["slug"] == "amplitude"
        assert rec["pricing_model"] == "freemium"
        assert len(rec["features"]) == 2

    def test_computes_score_payload_from_features_and_plans(self):
        score = seed_tools.compute_score_payload(
            features=["Feature A", "Feature B"],
            pricing_plans=[
                {"name": "Free", "is_free": True, "amount_minor": 0, "billing_interval": "monthly"}
            ],
        )
        assert score["score_version"] == "v1"
        assert score["overall_score"] > 0
        assert score["dimension_scores"]["feature_breadth"] == 100.0
        assert score["dimension_scores"]["pricing_transparency"] == 100.0


class _FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return SimpleNamespace(all=lambda: self._rows)


def _run_coro(coro):
    try:
        while True:
            coro.send(None)
    except StopIteration as done:
        return done.value


class TestBatchUpsert:
    def test_skips_verified_tools_and_inserts_new_tools(self, tmp_path: Path):
        enriched = tmp_path / "enriched.jsonl"
        enriched.write_text(
            "\n".join(
                [
                    json.dumps(
                        {
                            "name": "CuratedTool",
                            "slug": "curated-tool",
                            "website_url": "https://curated.ai",
                            "primary_category_slug": "ai",
                            "tag_slugs": ["ai"],
                            "pricing_model": "free",
                            "pricing_plans": [],
                            "features": ["Chat"],
                        }
                    ),
                    json.dumps(
                        {
                            "name": "NewTool",
                            "slug": "new-tool",
                            "website_url": "https://newtool.ai",
                            "tagline": "New AI tool",
                            "description": "Does things.",
                            "primary_category_slug": "ai",
                            "tag_slugs": ["ai"],
                            "pricing_model": "freemium",
                            "pricing_plans": [
                                {"name": "Free", "is_free": True, "amount_minor": 0, "billing_interval": "monthly"}
                            ],
                            "features": ["Fast search", "API"],
                        }
                    ),
                ]
            )
            + "\n",
            encoding="utf-8",
        )

        cat_id = uuid.uuid4()
        tag_id = uuid.uuid4()
        existing_verified = SimpleNamespace(id=uuid.uuid4(), slug="curated-tool", is_verified=True)

        fake_session = MagicMock()
        fake_session.execute = AsyncMock(
            side_effect=[
                _FakeResult([SimpleNamespace(id=cat_id, slug="ai")]),
                _FakeResult([SimpleNamespace(id=tag_id, slug="ai")]),
                _FakeResult([]),
                _FakeResult([existing_verified]),
            ]
        )
        added_objs = []
        fake_session.add = MagicMock(side_effect=added_objs.append)
        fake_session.flush = AsyncMock()
        fake_session.commit = AsyncMock()

        fake_deps = {
            "select": lambda model: model,
            "CategoryModel": lambda **kw: SimpleNamespace(**kw),
            "TagModel": lambda **kw: SimpleNamespace(**kw),
            "ToolModel": lambda **kw: SimpleNamespace(**kw),
            "ToolCategoryModel": lambda **kw: SimpleNamespace(**kw),
            "ToolTagModel": lambda **kw: SimpleNamespace(**kw),
            "FeatureModel": lambda **kw: SimpleNamespace(**kw),
            "ToolFeatureModel": lambda **kw: SimpleNamespace(**kw),
            "PricingPlanModel": lambda **kw: SimpleNamespace(**kw),
            "ScoreHistoryModel": lambda **kw: SimpleNamespace(**kw),
        }

        with patch.object(seed_tools, "_load_db_deps", return_value=fake_deps):
            stats = _run_coro(
                seed_tools.seed_from_jsonl(
                    jsonl_path=enriched,
                    session=fake_session,
                    platform_status="published",
                    batch_size=50,
                )
            )

        assert stats["inserted"] == 1
        assert stats["skipped_verified"] == 1
        assert fake_session.commit.await_count >= 1
        assert len(added_objs) >= 5  # Tool, ToolCategory, ToolTag, PricingPlan, Features, ScoreHistory
