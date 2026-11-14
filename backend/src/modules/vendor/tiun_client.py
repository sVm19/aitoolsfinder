import logging
from typing import Any, Dict, List, Optional
import httpx
from src.core.config import settings

logger = logging.getLogger(__name__)


class TiunClient:
    """Client for Tiun Business Server-to-Server (S2S) APIs."""

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (base_url or settings.TIUN_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.TIUN_API_KEY

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def verify_product_access(
        self, user_id: str, product_id: str, reference_id: Optional[str] = None
    ) -> bool:
        """Verify whether a user has active access to a product via S2S API."""
        if not self.api_key:
            # If no API key configured (e.g. testing or mock), log warning and allow
            logger.warning("TIUN_API_KEY not configured; skipping remote S2S check.")
            return True

        url = f"{self.base_url}/live_api/s2s/v1/users/{user_id}/product_access/{product_id}"
        params: Dict[str, str] = {}
        if reference_id:
            params["referenceId"] = reference_id

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json()
                    # Response format: {"hasAccess": true, "access": {...}}
                    return bool(data.get("hasAccess", True))
                logger.warning(
                    "Tiun product access check failed: HTTP %s - %s",
                    resp.status_code,
                    resp.text,
                )
                return False
        except Exception as exc:
            logger.error("Exception during Tiun product access verification: %s", exc)
            return False

    async def list_user_product_access(self, user_id: str) -> List[Dict[str, Any]]:
        """List active product accesses for a given user."""
        if not self.api_key:
            return []

        url = f"{self.base_url}/live_api/s2s/v1/users/{user_id}/product_access"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
                if resp.status_code == 200:
                    data = resp.json()
                    return data if isinstance(data, list) else data.get("items", [])
                return []
        except Exception as exc:
            logger.error("Exception listing Tiun product access: %s", exc)
            return []

    async def verify_user_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify client-side verification token via v2 S2S API."""
        if not self.api_key:
            return None

        url = f"{self.base_url}/live_api/s2s/v2/users/verification"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url, json={"token": token}, headers=self._headers()
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("user")
                return None
        except Exception as exc:
            logger.error("Exception verifying Tiun user token: %s", exc)
            return None


tiun_client = TiunClient()
