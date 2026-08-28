from __future__ import annotations

import httpx

from app.core.config import Settings, get_settings


class AiGateway:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def generate_executive_brief(
        self,
        *,
        question: str,
        authorized_context: dict[str, object],
    ) -> dict[str, object]:
        if not authorized_context.get("authorizedMetrics"):
            return {
                "mode": "data_unavailable",
                "provider": self.settings.llm_provider,
                "model": self.settings.llm_model,
                "text": "Connect and map an authorized financial data source before requesting AI analysis.",
            }

        if not self.settings.llm_api_key or not self.settings.llm_base_url:
            return {
                "mode": "provider_not_configured",
                "provider": self.settings.llm_provider,
                "model": self.settings.llm_model,
                "text": "AI analysis is unavailable until a model provider is configured on the backend.",
            }

        if self.settings.llm_provider != "qwen":
            return {
                "mode": "unsupported_provider",
                "provider": self.settings.llm_provider,
                "model": self.settings.llm_model,
                "text": "The configured LLM provider is not implemented by the current AI gateway.",
            }

        payload = {
            "model": self.settings.llm_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are WealthTwin AI CFO. Use only the authorized financial context. "
                        "Do not invent numbers. State assumptions and evidence."
                    ),
                },
                {
                    "role": "user",
                    "content": {
                        "question": question,
                        "authorized_context": authorized_context,
                    },
                },
            ],
            "temperature": 0.2,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.settings.llm_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {
            "mode": "live_llm",
            "provider": self.settings.llm_provider,
            "model": self.settings.llm_model,
            "text": text,
        }
