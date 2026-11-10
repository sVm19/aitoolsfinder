import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_category_lifecycle(client: AsyncClient):
    # 1. Initial list should be empty
    resp = await client.get("/api/v1/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0

    # 2. Admin creates category
    cat_payload = {
        "name": "Developer Tools",
        "slug": "developer-tools",
        "description": "Essential coding assistants and dev environments.",
        "seo_title": "Top AI Developer Tools | AIToolsFinder",
        "seo_description": "Compare AI coding tools.",
        "is_active": True,
        "sort_order": 10,
    }
    create_resp = await client.post("/api/v1/admin/categories", json=cat_payload)
    assert create_resp.status_code == 201
    created_cat = create_resp.json()
    assert created_cat["name"] == "Developer Tools"
    assert created_cat["slug"] == "developer-tools"
    cat_id = created_cat["id"]

    # 3. Retrieve public category by slug
    get_resp = await client.get("/api/v1/categories/developer-tools")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == cat_id

    # 4. Update category
    patch_resp = await client.patch(
        f"/api/v1/admin/categories/{cat_id}",
        json={"description": "Updated developer tools description."},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["description"] == "Updated developer tools description."

    # 5. List categories now returns 1 item
    list_resp = await client.get("/api/v1/categories")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1
    assert list_resp.json()["items"][0]["slug"] == "developer-tools"


@pytest.mark.asyncio
async def test_tag_lifecycle(client: AsyncClient):
    # 1. Initial list empty
    resp = await client.get("/api/v1/tags")
    assert resp.status_code == 200
    assert resp.json()["items"] == []

    # 2. Create tag
    tag_payload = {"name": "Coding Assistant", "slug": "coding-assistant"}
    create_resp = await client.post("/api/v1/admin/tags", json=tag_payload)
    assert create_resp.status_code == 201
    assert create_resp.json()["name"] == "Coding Assistant"

    # 3. List tags
    list_resp = await client.get("/api/v1/tags")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1
    assert list_resp.json()["items"][0]["slug"] == "coding-assistant"


@pytest.mark.asyncio
async def test_tool_lifecycle_and_validation(client: AsyncClient):
    # 1. Setup category and tag first
    cat_res = await client.post(
        "/api/v1/admin/categories",
        json={"name": "Productivity", "slug": "productivity"},
    )
    cat_id = cat_res.json()["id"]

    tag_res = await client.post(
        "/api/v1/admin/tags",
        json={"name": "Automation", "slug": "automation"},
    )
    tag_id = tag_res.json()["id"]

    # 2. Create tool as draft
    tool_payload = {
        "name": "Cursor",
        "slug": "cursor",
        "tagline": "The AI Code Editor",
        "description": "An AI-first code editor built on VS Code.",
        "website_url": "https://cursor.com",
        "primary_category_id": cat_id,
        "category_ids": [cat_id],
        "tag_ids": [tag_id],
        "pricing_model": "freemium",
        "platform_status": "draft",
        "pricing_plans": [
            {
                "name": "Hobby",
                "is_free": True,
                "amount_minor": 0,
                "billing_interval": "monthly",
            },
            {
                "name": "Pro",
                "is_free": False,
                "amount_minor": 2000,
                "currency": "USD",
                "billing_interval": "monthly",
            },
        ],
    }
    create_tool_resp = await client.post("/api/v1/admin/tools", json=tool_payload)
    assert create_tool_resp.status_code == 201
    tool_data = create_tool_resp.json()
    assert tool_data["name"] == "Cursor"
    assert tool_data["platform_status"] == "draft"
    assert len(tool_data["pricing_plans"]) == 2
    assert len(tool_data["categories"]) == 1
    assert len(tool_data["tags"]) == 1
    tool_id = tool_data["id"]

    # 3. Public tools list should NOT list draft tools
    public_list = await client.get("/api/v1/tools")
    assert public_list.status_code == 200
    assert public_list.json()["total"] == 0

    # 4. Publish tool
    publish_res = await client.post(f"/api/v1/admin/tools/{tool_id}/publish")
    assert publish_res.status_code == 200
    assert publish_res.json()["platform_status"] == "published"

    # 5. Public tools list should now contain Cursor
    public_list_after = await client.get("/api/v1/tools?category=productivity")
    assert public_list_after.status_code == 200
    assert public_list_after.json()["total"] == 1
    assert public_list_after.json()["items"][0]["slug"] == "cursor"

    # 6. Retrieve single tool detail by slug
    detail_res = await client.get("/api/v1/tools/cursor")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["name"] == "Cursor"
    assert detail["primary_category"]["slug"] == "productivity"
    assert detail["tags"][0]["slug"] == "automation"

    # 7. Verify tool
    verify_res = await client.post(f"/api/v1/admin/tools/{tool_id}/verify")
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True
    assert verify_res.json()["last_verified_at"] is not None

    # 8. Archive tool
    archive_res = await client.post(f"/api/v1/admin/tools/{tool_id}/archive")
    assert archive_res.status_code == 200
    assert archive_res.json()["platform_status"] == "archived"

    # Archived tool disappears from published list
    archived_list = await client.get("/api/v1/tools")
    assert archived_list.status_code == 200
    assert archived_list.json()["total"] == 0


@pytest.mark.asyncio
async def test_tool_publish_validation_failure(client: AsyncClient):
    # Tool without website or category cannot be published
    tool_payload = {
        "name": "Incomplete Tool",
        "slug": "incomplete-tool",
        "website_url": "https://example.com",
        "platform_status": "draft",
        "primary_category_id": None,
        "category_ids": [],
    }
    res = await client.post("/api/v1/admin/tools", json=tool_payload)
    assert res.status_code == 201
    tool_id = res.json()["id"]

    # Publishing without category should fail with 422 Unprocessable Entity
    pub_res = await client.post(f"/api/v1/admin/tools/{tool_id}/publish")
    assert pub_res.status_code == 422
    assert "category" in pub_res.json()["error"]["message"]

