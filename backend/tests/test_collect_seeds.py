"""TDD tests for Part 1: backend/scripts/collect_seeds.py."""

import io
import json
import sys
import urllib.error
from pathlib import Path
from unittest.mock import patch

import pytest

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import collect_seeds  # noqa: E402


class TestNormalizeUrl:
    def test_strips_query_params_and_normalizes_root_domain(self):
        assert collect_seeds.normalize_url(
            "https://cursor.com/?ref=producthunt#top"
        ) == (
            "https://cursor.com",
            "cursor.com",
        )
        assert collect_seeds.normalize_url("https://app.cursor.com/pricing") == (
            "https://app.cursor.com/pricing",
            "cursor.com",
        )

    def test_handles_multipart_tlds(self):
        clean, root = collect_seeds.normalize_url("https://app.example.co.uk/home")
        assert clean == "https://app.example.co.uk/home"
        assert root == "example.co.uk"

    @pytest.mark.parametrize(
        "bad_url",
        [
            "",
            "ftp://example.com",
            "javascript:alert(1)",
            "https://user:pass@example.com",
            "https://example.com/with space",
            "http://localhost:3000",
            "http://127.0.0.1:8000",
            "https://github.com/org/repo",
            "https://x.com/tool",
            "https://youtube.com/watch?v=1",
        ],
    )
    def test_rejects_unsafe_or_blocked_domains(self, bad_url: str):
        assert collect_seeds.normalize_url(bad_url) is None


class TestCollectors:
    def test_collect_yc_filters_active_ai_saas(self):
        fake_yc = [
            {
                "name": "Cursor",
                "website": "https://app.cursor.com/?ref=yc",
                "status": "Active",
                "tags": ["AI", "Developer Tools"],
                "industry": "B2B",
                "one_liner": "AI code editor",
            },
            {
                "name": "DeadCo",
                "website": "https://dead.example.com",
                "status": "Inactive",
                "tags": ["AI"],
                "industry": "B2B",
                "one_liner": "Inactive",
            },
            {
                "name": "Bakery",
                "website": "https://bakery.example.com",
                "status": "Active",
                "tags": ["Food"],
                "industry": "Consumer",
                "one_liner": "Bread",
            },
        ]
        with patch.object(collect_seeds, "_http_json", return_value=fake_yc):
            items = list(collect_seeds.collect_yc(limit=10))
        assert len(items) == 1
        assert items[0]["name"] == "Cursor"
        assert items[0]["domain"] == "cursor.com"
        assert items[0]["source"] == "yc"

    def test_collect_github_retries_on_429(self):
        rate_limit_err = urllib.error.HTTPError(
            url="https://api.github.com/search/repositories",
            code=429,
            msg="Too Many Requests",
            hdrs={"Retry-After": "0"},
            fp=io.BytesIO(b"{}"),
        )
        ok_resp = {
            "items": [
                {
                    "name": "vllm",
                    "homepage": "https://docs.vllm.ai/en/latest/",
                    "description": "Fast LLM inference",
                }
            ]
        }
        calls = {"n": 0}

        def fake_http(url, **kwargs):
            calls["n"] += 1
            if calls["n"] == 1:
                raise rate_limit_err
            return ok_resp

        with (
            patch.object(collect_seeds, "_http_json", side_effect=fake_http),
            patch.object(collect_seeds.time, "sleep"),
        ):
            items = list(collect_seeds.collect_github(limit=1))

        assert calls["n"] >= 2
        assert len(items) == 1
        assert items[0]["domain"] == "vllm.ai"
        assert items[0]["source"] == "github"

    def test_collect_producthunt_skips_without_token(self, monkeypatch):
        monkeypatch.delenv("PRODUCTHUNT_TOKEN", raising=False)
        assert list(collect_seeds.collect_producthunt(limit=5)) == []

    def test_collect_producthunt_parses_graphql(self, monkeypatch):
        monkeypatch.setenv("PRODUCTHUNT_TOKEN", "test-token")
        fake_gql = {
            "data": {
                "posts": {
                    "pageInfo": {"hasNextPage": False, "endCursor": None},
                    "edges": [
                        {
                            "node": {
                                "name": "Perplexity",
                                "tagline": "AI answer engine",
                                "website": "https://www.perplexity.ai/?ref=ph",
                            }
                        }
                    ],
                }
            }
        }
        with patch.object(collect_seeds, "_http_json", return_value=fake_gql):
            items = list(collect_seeds.collect_producthunt(limit=5))
        assert len(items) == 1
        assert items[0]["domain"] == "perplexity.ai"
        assert items[0]["source"] == "producthunt"


def test_deduplicates_across_sources_and_existing_file(tmp_path: Path):
    out_file = tmp_path / "seeds.jsonl"
    out_file.write_text(
        json.dumps(
            {
                "name": "Cursor",
                "website_url": "https://cursor.com",
                "domain": "cursor.com",
                "source": "yc",
                "hint": "Existing",
            }
        )
        + "\n",
        encoding="utf-8",
    )
    fake_yc = [
        {
            "name": "Cursor App",
            "website": "https://app.cursor.com",
            "status": "Active",
            "tags": ["AI"],
            "industry": "B2B",
            "one_liner": "Duplicate domain",
        },
        {
            "name": "Linear",
            "website": "https://linear.app",
            "status": "Active",
            "tags": ["SaaS"],
            "industry": "B2B",
            "one_liner": "Issue tracker",
        },
    ]
    with patch.object(collect_seeds, "_http_json", return_value=fake_yc):
        added, total = collect_seeds.run_collection(
            sources=["yc"], limit=10, out_path=out_file
        )
    assert added == 1
    assert total == 2
    lines = [
        json.loads(line) for line in out_file.read_text(encoding="utf-8").splitlines()
    ]
    assert [row["domain"] for row in lines] == ["cursor.com", "linear.app"]
