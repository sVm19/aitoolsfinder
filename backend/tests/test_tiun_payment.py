import json
import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from src.modules.vendor.tiun_client import TiunClient


@pytest.mark.asyncio
async def test_tiun_webhook_product_access_add(client, db_session):
    event_id = f"evt_test_{uuid.uuid4().hex[:8]}"
    user_uuid = uuid.uuid4()
    payload = {
        "event": "product_access.add",
        "id": event_id,
        "userId": str(user_uuid),
        "productId": "pro_monthly",
        "referenceId": str(user_uuid),
    }

    with patch("src.modules.vendor.router.tiun_client.verify_product_access", new=AsyncMock(return_value=True)):
        response = await client.post("/api/v1/webhooks/tiun", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["event_id"] == event_id

    # Verify idempotency
    response_dup = await client.post("/api/v1/webhooks/tiun", json=payload)
    assert response_dup.status_code == 200
    assert response_dup.json()["status"] == "already_processed"


@pytest.mark.asyncio
async def test_tiun_webhook_product_access_remove(client, db_session):
    event_id = f"evt_remove_{uuid.uuid4().hex[:8]}"
    user_uuid = uuid.uuid4()
    payload = {
        "event": "product_access.remove",
        "id": event_id,
        "userId": str(user_uuid),
        "productId": "pro_monthly",
    }

    response = await client.post("/api/v1/webhooks/tiun", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "processed"


@pytest.mark.asyncio
async def test_tiun_client_mock():
    tc = TiunClient(api_key="test_key")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"hasAccess": True}

    with patch("httpx.AsyncClient") as MockClient:
        instance = AsyncMock()
        instance.get = AsyncMock(return_value=mock_resp)
        MockClient.return_value.__aenter__.return_value = instance

        has_access = await tc.verify_product_access("user_1", "prod_1")
        assert has_access is True
