from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class ConnectorSchema:
    provider: str
    entities: list[str]
    fields: dict[str, list[str]]


@dataclass(frozen=True)
class ProviderSyncResult:
    customers: list[dict[str, object]]
    sales_orders: list[dict[str, object]]
    cursor: dict[str, object]
    credentials: dict[str, object]

    @property
    def record_count(self) -> int:
        return len(self.customers) + len(self.sales_orders)


class CrmConnector(ABC):
    provider: str

    @abstractmethod
    def authorization_url(self, *, state: str, code_challenge: str | None = None) -> str:
        raise NotImplementedError

    @abstractmethod
    async def exchange_code(
        self,
        *,
        code: str,
        code_verifier: str | None = None,
    ) -> dict[str, object]:
        raise NotImplementedError

    @abstractmethod
    async def discover_schema(self, credentials: dict[str, object]) -> ConnectorSchema:
        raise NotImplementedError

    @abstractmethod
    async def sync_incremental(
        self,
        credentials: dict[str, object],
        cursor: dict[str, object],
    ) -> ProviderSyncResult:
        raise NotImplementedError
