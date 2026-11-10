import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "AIToolsFinder API"
    assert data["domain"] == "https://aitoolsfinder.cloud"
    assert data["status"] == "operational"


@pytest.mark.asyncio
async def test_health_live(client: AsyncClient):
    response = await client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "environment" in data


@pytest.mark.asyncio
async def test_health_ready_disconnected(client: AsyncClient):
    response = await client.get("/api/v1/health/ready")
    # When PostgreSQL is not connected locally, readiness returns 503
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "unhealthy"
    assert data["database"] == "disconnected"


@pytest.mark.asyncio
async def test_request_id_middleware(client: AsyncClient):
    response = await client.get("/api/v1/health/live")
    assert "X-Request-ID" in response.headers
    assert "X-Response-Time-Ms" in response.headers
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


@pytest.mark.asyncio
async def test_custom_request_id_passthrough(client: AsyncClient):
    custom_id = "test-custom-request-id-12345"
    response = await client.get(
        "/api/v1/health/live", headers={"X-Request-ID": custom_id}
    )
    assert response.headers["X-Request-ID"] == custom_id
