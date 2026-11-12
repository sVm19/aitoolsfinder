import pytest


@pytest.mark.asyncio
async def test_identity_routes_are_mounted_once(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_vendor_routes_are_mounted_once(client):
    response = await client.post("/api/v1/submissions", json={})
    assert response.status_code in (401, 422)


@pytest.mark.asyncio
async def test_duplicate_api_prefix_is_absent(client):
    response = await client.get("/api/v1/api/v1/users/me")
    assert response.status_code == 404
