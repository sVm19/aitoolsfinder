"""Tests verifying duplicate project submissions are rejected with 409 Conflict."""

from pathlib import Path


def test_vendor_router_rejects_duplicate_slug_or_domain_with_409():
    router_path = Path(__file__).resolve().parent.parent / "src" / "modules" / "vendor" / "router.py"
    source = router_path.read_text(encoding="utf-8")

    # Ensure the old UUID-suffix workaround is gone
    assert 'f"{slug}-{uuid.uuid4().hex[:8]}"' not in source

    # Ensure both pending/approved submissions and existing catalog tools are checked
    assert "HTTP_409_CONFLICT" in source
    assert "ToolSubmissionModel.website_url.ilike" in source
    assert "ToolModel.website_url.ilike" in source
