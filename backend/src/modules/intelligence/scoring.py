from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional

from src.modules.catalog.models import ToolModel


SCORE_VERSION = "v1"
WEIGHTS = {
    "feature_breadth": Decimal("30"),
    "pricing_transparency": Decimal("25"),
    "verification_freshness": Decimal("25"),
    "community_documentation": Decimal("20"),
}
_CENT = Decimal("0.01")


@dataclass(frozen=True)
class ToolScore:
    score_version: str
    overall_score: Optional[Decimal]
    dimension_scores: Dict[str, Optional[Decimal]]
    available_weight_percent: Decimal
    evidence: List[str]


def _percent(numerator: int, denominator: int) -> Decimal:
    if denominator == 0:
        return Decimal("0")
    return (Decimal(numerator) * Decimal("100") / Decimal(denominator)).quantize(
        _CENT, rounding=ROUND_HALF_UP
    )


def calculate_tool_score(
    tool: ToolModel, *, as_of: Optional[datetime] = None
) -> ToolScore:
    """Calculate a reproducible score from catalog evidence only.

    Dimensions absent from the catalog schema remain unavailable and their
    weights are excluded from the weighted mean. Pass ``as_of`` when replaying
    historical calculations so freshness scores remain reproducible.
    """
    calculated_at = as_of or datetime.now(timezone.utc)
    if calculated_at.tzinfo is None:
        calculated_at = calculated_at.replace(tzinfo=timezone.utc)
    features = list(getattr(tool, "features", []) or [])
    plans = list(getattr(tool, "pricing_plans", []) or [])
    evidence: List[str] = []
    dimensions: Dict[str, Optional[Decimal]] = {
        "feature_breadth": None,
        "pricing_transparency": None,
        "verification_freshness": None,
        # Catalog does not yet store community or documentation signals.
        "community_documentation": None,
    }

    if features:
        support_values = {"yes": 2, "partial": 1, "no": 0, "unknown": 0}
        known_features = [
            feature
            for feature in features
            if getattr(feature, "support_level", "unknown") in support_values
            and getattr(feature, "support_level", "unknown") != "unknown"
        ]
        if known_features:
            points = sum(
                support_values[getattr(feature, "support_level")]
                for feature in known_features
            )
            dimensions["feature_breadth"] = _percent(
                points, len(known_features) * 2
            )
        evidence.append(f"feature_records_known:{len(known_features)}")

    if plans:
        transparency_points = 0
        for plan in plans:
            transparency_points += int(
                bool(getattr(plan, "is_free", False))
                or getattr(plan, "amount_minor", None) is not None
            )
            transparency_points += int(
                getattr(plan, "billing_interval", "unknown") != "unknown"
            )
            transparency_points += int(
                bool(getattr(plan, "pricing_url", None))
                or bool(getattr(plan, "source_url", None))
            )
        dimensions["pricing_transparency"] = _percent(
            transparency_points, len(plans) * 3
        )
        evidence.append(f"pricing_plans:{len(plans)}")

    verified = bool(getattr(tool, "is_verified", False))
    last_verified_at = getattr(tool, "last_verified_at", None)
    verification_score = Decimal("100") if verified else Decimal("0")
    if last_verified_at is not None:
        if last_verified_at.tzinfo is None:
            last_verified_at = last_verified_at.replace(tzinfo=timezone.utc)
        age_days = max(0, (calculated_at - last_verified_at).days)
        freshness_score = (
            Decimal("100")
            if age_days <= 30
            else Decimal("50")
            if age_days <= 180
            else Decimal("0")
        )
        dimensions["verification_freshness"] = (
            verification_score * Decimal("0.6")
            + freshness_score * Decimal("0.4")
        ).quantize(_CENT, rounding=ROUND_HALF_UP)
        evidence.append(f"last_verified_age_days:{age_days}")
    else:
        dimensions["verification_freshness"] = verification_score
        evidence.append("last_verified_at:unavailable")
    evidence.append(f"is_verified:{str(verified).lower()}")
    evidence.append("community_documentation:unavailable")

    available_dimensions = [
        (WEIGHTS[name], score)
        for name, score in dimensions.items()
        if score is not None
    ]
    available_weight = sum((weight for weight, _ in available_dimensions), Decimal("0"))
    overall_score = None
    if available_weight:
        weighted_total = sum(
            (weight * score for weight, score in available_dimensions), Decimal("0")
        )
        overall_score = (weighted_total / available_weight).quantize(
            _CENT, rounding=ROUND_HALF_UP
        )

    return ToolScore(
        score_version=SCORE_VERSION,
        overall_score=overall_score,
        dimension_scores=dimensions,
        available_weight_percent=available_weight,
        evidence=evidence,
    )
