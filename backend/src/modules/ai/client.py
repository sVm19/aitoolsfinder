"""AI provider adapters: OpenRouter (primary) and optional Groq."""

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any, Mapping, Sequence

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_SITE_URL = "https://aitoolsfinder.cloud"
OPENROUTER_APP_TITLE = "AIToolsFinder"
_CIRCUIT_FAILURE_LIMIT = 3
_CIRCUIT_COOLDOWN_SECONDS = 30.0
_RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}


class OpenRouterError(Exception):
    """Base error for provider failures safe to handle at the boundary."""


class OpenRouterUnavailable(OpenRouterError):
    """Provider is unconfigured, unavailable, or temporarily circuit-open."""


class OpenRouterRequestError(OpenRouterError):
    """Provider rejected a request or returned an invalid response."""


@dataclass(frozen=True)
class OpenRouterCompletion:
    content: str
    model: str
    prompt_tokens: int | None
    completion_tokens: int | None


def build_openrouter_payload(
    messages: Sequence[Mapping[str, str]],
    *,
    model: str | None = None,
    max_tokens: int = 1200,
    temperature: float = 0.2,
) -> dict[str, Any]:
    """Build an OpenRouter chat-completion payload with deterministic sampling."""
    if not messages:
        raise ValueError("At least one chat message is required.")
    return {
        "model": model or settings.OPENROUTER_MODEL,
        "messages": [dict(message) for message in messages],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
    }


def _optional_int(value: Any) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None


def parse_chat_completion_response(data: Mapping[str, Any]) -> OpenRouterCompletion:
    """Extract the assistant message and usage from an OpenRouter response."""
    try:
        choice = data["choices"][0]
        content = choice["message"]["content"]
        model = data["model"]
        usage = data.get("usage") or {}
        if not isinstance(content, str) or not isinstance(model, str):
            raise TypeError("Unexpected completion field types.")
        return OpenRouterCompletion(
            content=content,
            model=model,
            prompt_tokens=_optional_int(usage.get("prompt_tokens")),
            completion_tokens=_optional_int(usage.get("completion_tokens")),
        )
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenRouterRequestError(
            "Provider returned an invalid completion."
        ) from exc


class OpenRouterClient:
    """Bounded OpenRouter client with retries and a process-local circuit breaker."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._api_key = api_key or settings.OPENROUTER_API_KEY
        self._model = model or settings.OPENROUTER_MODEL
        self._transport = transport
        self._failures = 0
        self._open_until = 0.0
        self._circuit_lock = asyncio.Lock()

    async def complete(
        self,
        messages: Sequence[Mapping[str, str]],
        *,
        max_tokens: int = 1200,
        temperature: float = 0.2,
    ) -> OpenRouterCompletion:
        if not self._api_key:
            raise OpenRouterUnavailable("OpenRouter is not configured.")

        if await self._is_circuit_open():
            raise OpenRouterUnavailable("OpenRouter is temporarily unavailable.")

        payload = build_openrouter_payload(
            messages,
            model=self._model,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "HTTP-Referer": OPENROUTER_SITE_URL,
            "X-Title": OPENROUTER_APP_TITLE,
            "Content-Type": "application/json",
        }
        max_retries = max(0, settings.OPENROUTER_MAX_RETRIES)
        timeout = max(1.0, float(settings.OPENROUTER_TIMEOUT_SECONDS))
        started_at = time.monotonic()

        async with httpx.AsyncClient(
            timeout=timeout, transport=self._transport
        ) as client:
            for attempt in range(max_retries + 1):
                try:
                    response = await client.post(
                        OPENROUTER_CHAT_COMPLETIONS_URL,
                        json=payload,
                        headers=headers,
                    )
                    response.raise_for_status()
                    completion = parse_chat_completion_response(response.json())
                    await self._record_success()
                    logger.info(
                        "OpenRouter completion model=%s latency_s=%.2f "
                        "prompt_tokens=%s completion_tokens=%s",
                        completion.model,
                        time.monotonic() - started_at,
                        completion.prompt_tokens,
                        completion.completion_tokens,
                    )
                    return completion
                except (httpx.TimeoutException, httpx.TransportError):
                    if attempt < max_retries:
                        await asyncio.sleep(0.25 * (2**attempt))
                        continue
                    await self._record_failure()
                    raise OpenRouterUnavailable(
                        "OpenRouter is temporarily unavailable."
                    ) from None
                except httpx.HTTPStatusError as exc:
                    status_code = exc.response.status_code
                    if status_code in _RETRYABLE_STATUS_CODES and attempt < max_retries:
                        await asyncio.sleep(0.5 * (2**attempt))
                        continue
                    await self._record_failure()
                    raise OpenRouterRequestError(
                        f"OpenRouter rejected the request with status {status_code}."
                    ) from exc

        raise OpenRouterUnavailable("OpenRouter is temporarily unavailable.")

    async def _is_circuit_open(self) -> bool:
        async with self._circuit_lock:
            if self._open_until > time.monotonic():
                return True
            if self._open_until:
                self._open_until = 0.0
                self._failures = 0
            return False

    async def _record_success(self) -> None:
        async with self._circuit_lock:
            self._failures = 0
            self._open_until = 0.0

    async def _record_failure(self) -> None:
        async with self._circuit_lock:
            self._failures += 1
            if self._failures >= _CIRCUIT_FAILURE_LIMIT:
                self._open_until = time.monotonic() + _CIRCUIT_COOLDOWN_SECONDS


# --- Groq adapter ---

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqUnavailable(OpenRouterError):
    """Groq is unconfigured, unavailable, or its SDK is not installed."""


class GroqRequestError(OpenRouterError):
    """Groq rejected a request or returned an invalid response."""


@dataclass(frozen=True)
class GroqCompletion:
    content: str
    model: str
    prompt_tokens: int | None
    completion_tokens: int | None


def build_groq_payload(
    messages: Sequence[Mapping[str, str]],
    *,
    model: str | None = None,
    max_tokens: int = 1200,
    temperature: float = 0.2,
) -> dict[str, Any]:
    """Build a Groq chat-completion payload."""
    if not messages:
        raise ValueError("At least one chat message is required.")
    return {
        "model": model or settings.GROQ_MODEL,
        "messages": [dict(message) for message in messages],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }


def parse_groq_response(data: Mapping[str, Any]) -> GroqCompletion:
    """Extract fields from a Groq chat-completion response."""
    try:
        choice = data["choices"][0]
        content = choice["message"]["content"]
        model = data["model"]
        usage = data.get("usage") or {}
        if not isinstance(content, str) or not isinstance(model, str):
            raise TypeError("Unexpected completion field types.")
        return GroqCompletion(
            content=content,
            model=model,
            prompt_tokens=_optional_int(usage.get("prompt_tokens")),
            completion_tokens=_optional_int(usage.get("completion_tokens")),
        )
    except (KeyError, IndexError, TypeError) as exc:
        raise GroqRequestError("Groq returned an invalid completion.") from exc


class GroqClientAdapter:
    """Bounded Groq adapter with retries, mirroring OpenRouterClient patterns."""

    def __init__(self, *, groq_api_key: str | None = None) -> None:
        try:
            from groq import Groq as GroqClient
        except ImportError as exc:
            raise GroqUnavailable("The Groq SDK is not installed.") from exc

        self._groq = GroqClient(
            api_key=groq_api_key or settings.GROQ_API_KEY,
            timeout=float(settings.OPENROUTER_TIMEOUT_SECONDS),
        )
        self._failures = 0
        self._open_until = 0.0
        self._circuit_lock = asyncio.Lock()

    async def complete(
        self,
        messages: Sequence[Mapping[str, str]],
        *,
        max_tokens: int = 1200,
        temperature: float = 0.2,
    ) -> GroqCompletion:
        if not self._groq.api_key:
            raise GroqUnavailable("Groq is not configured.")

        if await self._is_circuit_open():
            raise GroqUnavailable("Groq is temporarily unavailable.")

        payload = build_groq_payload(
            messages, max_tokens=max_tokens, temperature=temperature
        )
        max_retries = max(0, settings.OPENROUTER_MAX_RETRIES)
        started_at = time.monotonic()

        for attempt in range(max_retries + 1):
            try:
                response = await asyncio.to_thread(
                    self._groq.chat.completions.create, **payload
                )
                completion = parse_groq_response(response.model_dump())
                await self._record_success()
                logger.info(
                    "Groq completion model=%s latency_s=%.2f",
                    completion.model,
                    time.monotonic() - started_at,
                )
                return completion
            except Exception as exc:
                status_code = getattr(exc, "status_code", None)
                retryable = status_code is None or status_code in _RETRYABLE_STATUS_CODES
                if not retryable:
                    raise GroqRequestError("Groq rejected the request.") from exc
                if attempt < max_retries:
                    await asyncio.sleep(0.25 * (2**attempt))
                    continue
                await self._record_failure()
                logger.warning("Groq unavailable after %s attempt(s)", attempt + 1)
                raise GroqUnavailable("Groq is temporarily unavailable.") from exc

        raise GroqUnavailable("Groq is temporarily unavailable.")

    async def _is_circuit_open(self) -> bool:
        async with self._circuit_lock:
            if self._open_until > time.monotonic():
                return True
            if self._open_until:
                self._open_until = 0.0
                self._failures = 0
            return False

    async def _record_success(self) -> None:
        async with self._circuit_lock:
            self._failures = 0
            self._open_until = 0.0

    async def _record_failure(self) -> None:
        async with self._circuit_lock:
            self._failures += 1
            if self._failures >= _CIRCUIT_FAILURE_LIMIT:
                self._open_until = time.monotonic() + _CIRCUIT_COOLDOWN_SECONDS


# --- Unified client selector ---


def get_client() -> OpenRouterClient | GroqClientAdapter:
    """Prefer Groq when configured; fall back to OpenRouter when its SDK is absent."""
    if settings.GROQ_API_KEY:
        try:
            return GroqClientAdapter(groq_api_key=settings.GROQ_API_KEY)
        except GroqUnavailable:
            logger.warning("Groq is configured but unavailable; using OpenRouter.")
    return OpenRouterClient()