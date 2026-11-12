import uuid

import pytest

from src.core.security import is_safe_outbound_url
from src.modules.catalog.models import ToolModel
from src.modules.vendor.models import AffiliateLinkModel


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://example.com/pricing", True),
        ("http://example.com", True),
        ("javascript:alert(1)", False),
        ("data:text/html;base64,PHNjcmlwdD4=", False),
        ("ftp://example.com/file", False),
        ("https://user:pass@example.com", False),
        ("/relative/path", False),
    ],
)
def test_is_safe_outbound_url(url, expected):
    assert is_safe_outbound_url(url) is expected


@pytest.mark.asyncio
async def test_outbound_rejects_unsafe_affiliate_url(client, db_session):
    tool = ToolModel(
        id=uuid.uuid4(),
        name="Unsafe redirect fixture",
        slug=f"unsafe-{uuid.uuid4()}",
        website_url="https://example.test",
    )
    db_session.add(tool)
    db_session.add(
        AffiliateLinkModel(
            tool_id=tool.id,
            provider="test",
            provider_url="javascript:alert(1)",
        )
    )
    await db_session.commit()

    response = await client.post(f"/api/v1/outbound/{tool.id}")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_cors_rejects_untrusted_origin(client):
    response = await client.options(
        "/api/v1/categories",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None


@pytest.mark.asyncio
async def test_search_query_treats_sql_metacharacters_as_data(client):
    response = await client.get("/api/v1/tools", params={"q": "' OR 1=1 --"})
    assert response.status_code == 200
