"""Part 3: Idempotent PostgreSQL upsert & initial scoring from enriched.jsonl.

Usage (run with backend venv where SQLAlchemy/asyncpg are installed):
    backend/.venv/Scripts/python.exe backend/scripts/seed_tools.py --in data/enriched.jsonl
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import re
import sys
import urllib.parse
import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any

backend_dir = Path(__file__).resolve().parent.parent
repo_root = backend_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("seed_tools")

VALID_PRICING_MODELS = {
    "free",
    "freemium",
    "paid",
    "usage_based",
    "contact_sales",
    "unknown",
}
_CENT = Decimal("0.01")


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def is_safe_outbound_url(url: str) -> bool:
    """Allow only absolute HTTP(S) URLs without embedded credentials."""
    if not url or any(ch.isspace() for ch in url):
        return False
    try:
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname
    except ValueError:
        return False
    if parsed.scheme not in {"http", "https"}:
        return False
    if not parsed.netloc or not hostname:
        return False
    if parsed.username or parsed.password:
        return False
    return True


def normalize_record(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Validate and normalize an enriched JSONL record before DB upsert."""
    name = str(raw.get("name") or "").strip()[:255]
    website_url = str(raw.get("website_url") or "").strip()
    if not name or not is_safe_outbound_url(website_url):
        return None

    slug = _slugify(str(raw.get("slug") or name))[:255]
    if not slug:
        return None

    pricing_model = str(raw.get("pricing_model") or "unknown").strip().lower()
    if pricing_model not in VALID_PRICING_MODELS:
        pricing_model = "unknown"

    return {
        "name": name,
        "slug": slug,
        "website_url": website_url,
        "tagline": str(raw.get("tagline") or "").strip()[:500] or None,
        "description": str(raw.get("description") or "").strip() or None,
        "primary_category_slug": str(raw.get("primary_category_slug") or "").strip().lower(),
        "tag_slugs": [str(t).strip().lower() for t in (raw.get("tag_slugs") or []) if str(t).strip()],
        "pricing_model": pricing_model,
        "pricing_plans": list(raw.get("pricing_plans") or []),
        "features": [str(f).strip() for f in (raw.get("features") or []) if str(f).strip()],
    }


def compute_score_payload(
    *,
    features: list[str],
    pricing_plans: list[dict[str, Any]],
) -> dict[str, Any]:
    """Compute initial v1 ScoreHistory payload matching scoring.py weights."""
    weights = {
        "feature_breadth": Decimal("30"),
        "pricing_transparency": Decimal("25"),
        "verification_freshness": Decimal("25"),
    }
    dimensions: dict[str, float | None] = {
        "feature_breadth": 100.0 if features else None,
        "pricing_transparency": None,
        "verification_freshness": 0.0,
        "community_documentation": None,
    }
    evidence: list[str] = []

    if features:
        evidence.append(f"feature_records_known:{len(features)}")

    if pricing_plans:
        pts = 0
        for p in pricing_plans:
            pts += int(bool(p.get("is_free")) or p.get("amount_minor") is not None)
            pts += int(str(p.get("billing_interval") or "unknown") != "unknown")
            pts += 1  # seeded from verified live website URL
        dimensions["pricing_transparency"] = float(
            (Decimal(pts) * Decimal("100") / Decimal(len(pricing_plans) * 3)).quantize(
                _CENT, rounding=ROUND_HALF_UP
            )
        )
        evidence.append(f"pricing_plans:{len(pricing_plans)}")

    available = [
        (weights[k], Decimal(str(v)))
        for k, v in dimensions.items()
        if v is not None and k in weights
    ]
    total_w = sum((w for w, _ in available), Decimal("0"))
    overall = (
        (sum((w * s for w, s in available), Decimal("0")) / total_w).quantize(
            _CENT, rounding=ROUND_HALF_UP
        )
        if total_w
        else Decimal("0.00")
    )

    return {
        "score_version": "v1",
        "overall_score": overall,
        "dimension_scores": dimensions,
        "evidence": evidence,
    }


def _load_db_deps() -> dict[str, Any]:
    """Lazily import SQLAlchemy and catalog/intelligence models."""
    from sqlalchemy import select
    from src.modules.catalog.models import (
        CategoryModel,
        FeatureModel,
        PricingPlanModel,
        TagModel,
        ToolCategoryModel,
        ToolFeatureModel,
        ToolModel,
        ToolTagModel,
    )
    from src.modules.intelligence.models import ScoreHistoryModel

    return {
        "select": select,
        "CategoryModel": CategoryModel,
        "TagModel": TagModel,
        "ToolModel": ToolModel,
        "ToolCategoryModel": ToolCategoryModel,
        "ToolTagModel": ToolTagModel,
        "FeatureModel": FeatureModel,
        "ToolFeatureModel": ToolFeatureModel,
        "PricingPlanModel": PricingPlanModel,
        "ScoreHistoryModel": ScoreHistoryModel,
    }


async def seed_from_jsonl(
    *,
    jsonl_path: Path,
    session: Any,
    platform_status: str = "published",
    batch_size: int = 50,
) -> dict[str, int]:
    """Idempotently upsert tools, taxonomy links, plans, features, and scores."""
    deps = _load_db_deps()
    select = deps["select"]
    CategoryModel = deps["CategoryModel"]
    TagModel = deps["TagModel"]
    ToolModel = deps["ToolModel"]
    ToolCategoryModel = deps["ToolCategoryModel"]
    ToolTagModel = deps["ToolTagModel"]
    FeatureModel = deps["FeatureModel"]
    ToolFeatureModel = deps["ToolFeatureModel"]
    PricingPlanModel = deps["PricingPlanModel"]
    ScoreHistoryModel = deps["ScoreHistoryModel"]

    records = [
        r
        for line in jsonl_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
        for r in [normalize_record(json.loads(line))]
        if r is not None
    ]

    cat_rows = (await session.execute(select(CategoryModel))).scalars().all()
    cat_by_slug = {c.slug: c.id for c in cat_rows}

    tag_rows = (await session.execute(select(TagModel))).scalars().all()
    tag_by_slug = {t.slug: t.id for t in tag_rows}

    feat_rows = (await session.execute(select(FeatureModel))).scalars().all()
    feat_by_slug = {f.slug: f for f in feat_rows}

    existing_rows = (await session.execute(select(ToolModel))).scalars().all()
    existing_by_slug = {t.slug: t for t in existing_rows}

    stats = {"inserted": 0, "updated": 0, "skipped_verified": 0}
    now = datetime.now(timezone.utc)

    for idx, rec in enumerate(records, start=1):
        slug = rec["slug"]
        existing = existing_by_slug.get(slug)
        if existing and getattr(existing, "is_verified", False):
            stats["skipped_verified"] += 1
            continue

        primary_cat_id = cat_by_slug.get(rec["primary_category_slug"])
        if existing:
            existing.name = rec["name"]
            existing.tagline = rec["tagline"]
            existing.description = rec["description"]
            existing.website_url = rec["website_url"]
            existing.primary_category_id = primary_cat_id
            existing.pricing_model = rec["pricing_model"]
            stats["updated"] += 1
            continue

        tool_id = uuid.uuid4()
        tool = ToolModel(
            id=tool_id,
            name=rec["name"],
            slug=slug,
            tagline=rec["tagline"],
            description=rec["description"],
            website_url=rec["website_url"],
            primary_category_id=primary_cat_id,
            pricing_model=rec["pricing_model"],
            platform_status=platform_status,
            is_verified=False,
            is_sponsored=False,
        )
        session.add(tool)
        existing_by_slug[slug] = tool

        if primary_cat_id:
            session.add(ToolCategoryModel(tool_id=tool_id, category_id=primary_cat_id))

        for t_slug in dict.fromkeys(rec["tag_slugs"]):
            t_id = tag_by_slug.get(t_slug)
            if t_id:
                session.add(ToolTagModel(tool_id=tool_id, tag_id=t_id))

        for plan in rec["pricing_plans"]:
            session.add(
                PricingPlanModel(
                    id=uuid.uuid4(),
                    tool_id=tool_id,
                    name=plan["name"],
                    amount_minor=plan.get("amount_minor"),
                    currency="USD",
                    billing_interval=plan.get("billing_interval", "unknown"),
                    is_free=bool(plan.get("is_free", False)),
                    source_url=rec["website_url"],
                )
            )

        for feat_name in rec["features"]:
            f_slug = _slugify(feat_name)
            if not f_slug:
                continue
            feat_obj = feat_by_slug.get(f_slug)
            if not feat_obj:
                feat_obj = FeatureModel(id=uuid.uuid4(), name=feat_name, slug=f_slug)
                session.add(feat_obj)
                feat_by_slug[f_slug] = feat_obj
            session.add(
                ToolFeatureModel(
                    tool_id=tool_id,
                    feature_id=feat_obj.id,
                    support_level="yes",
                    evidence_url=rec["website_url"],
                )
            )

        score = compute_score_payload(
            features=rec["features"],
            pricing_plans=rec["pricing_plans"],
        )
        session.add(
            ScoreHistoryModel(
                id=uuid.uuid4(),
                tool_id=tool_id,
                score_version=score["score_version"],
                overall_score=score["overall_score"],
                dimension_scores=score["dimension_scores"],
                evidence=score["evidence"],
                calculated_at=now,
            )
        )
        stats["inserted"] += 1

        if idx % batch_size == 0:
            await session.commit()

    await session.commit()
    logger.info("DB seed complete: %s", stats)
    return stats


async def _async_main(args: argparse.Namespace) -> None:
    from src.core.database import async_session_factory

    async with async_session_factory() as session:
        await seed_from_jsonl(
            jsonl_path=args.input,
            session=session,
            platform_status=args.status,
            batch_size=args.batch_size,
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed enriched tools into PostgreSQL.")
    parser.add_argument("--in", dest="input", type=Path, default=repo_root / "data" / "enriched.jsonl")
    parser.add_argument("--status", default="published", choices=["draft", "published"])
    parser.add_argument("--batch-size", type=int, default=50)
    args = parser.parse_args()
    asyncio.run(_async_main(args))


if __name__ == "__main__":
    main()
