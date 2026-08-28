from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from urllib.parse import urlencode

import httpx

from app.connectors.base import ConnectorSchema, CrmConnector, ProviderSyncResult
from app.core.config import Settings

HTTP_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


def crm_connector(provider: str, settings: Settings) -> CrmConnector:
    normalized = provider.strip().lower()
    if normalized == "salesforce":
        return SalesforceConnector(settings)
    if normalized == "hubspot":
        return HubSpotConnector(settings)
    raise ValueError("Unsupported CRM provider.")


class SalesforceConnector(CrmConnector):
    provider = "salesforce"

    def __init__(self, settings: Settings) -> None:
        self.client_id = settings.crm_salesforce_client_id
        self.client_secret = settings.crm_salesforce_client_secret
        self.redirect_uri = settings.crm_salesforce_redirect_uri
        self.api_version = settings.crm_salesforce_api_version
        self.login_url = settings.crm_salesforce_login_url.rstrip("/")

    def authorization_url(self, *, state: str, code_challenge: str | None = None) -> str:
        self._require_configuration()
        query = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "api refresh_token",
            "state": state,
        }
        if code_challenge:
            query["code_challenge"] = code_challenge
            query["code_challenge_method"] = "S256"
        return f"{self.login_url}/services/oauth2/authorize?{urlencode(query)}"

    async def exchange_code(
        self,
        *,
        code: str,
        code_verifier: str | None = None,
    ) -> dict[str, object]:
        self._require_configuration()
        form = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
        }
        if code_verifier:
            form["code_verifier"] = code_verifier
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            response = await client.post(
                f"{self.login_url}/services/oauth2/token",
                data=form,
            )
            response.raise_for_status()
            payload = response.json()
        identity_url = str(payload.get("id", ""))
        identity_parts = identity_url.rstrip("/").split("/")
        return {
            "access_token": payload["access_token"],
            "refresh_token": payload.get("refresh_token"),
            "instance_url": payload["instance_url"],
            "identity_url": identity_url,
            "external_account_id": identity_parts[-2] if len(identity_parts) >= 2 else None,
            "issued_at": payload.get("issued_at"),
            "token_type": payload.get("token_type", "Bearer"),
        }

    async def discover_schema(self, credentials: dict[str, object]) -> ConnectorSchema:
        await self._refresh(credentials)
        instance_url = _required_string(credentials, "instance_url")
        access_token = _required_string(credentials, "access_token")
        fields: dict[str, list[str]] = {}
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            for entity in ("Account", "Opportunity"):
                payload = await _request_json(
                    client,
                    "GET",
                    f"{instance_url}/services/data/{self.api_version}/sobjects/{entity}/describe",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                fields[entity] = [str(field["name"]) for field in payload.get("fields", [])]
        return ConnectorSchema(provider=self.provider, entities=list(fields), fields=fields)

    async def sync_incremental(
        self,
        credentials: dict[str, object],
        cursor: dict[str, object],
    ) -> ProviderSyncResult:
        await self._refresh(credentials)
        watermark = _cursor_watermark(cursor)
        condition = f" WHERE LastModifiedDate > {watermark}" if watermark else ""
        account_query = (
            "SELECT Id, Name, BillingCountry, Industry, LastModifiedDate "
            f"FROM Account{condition} ORDER BY LastModifiedDate ASC"
        )
        opportunity_query = (
            "SELECT Id, Name, AccountId, Amount, StageName, CloseDate, LastModifiedDate "
            f"FROM Opportunity{condition} ORDER BY LastModifiedDate ASC"
        )
        accounts = await self._query(credentials, account_query)
        opportunities = await self._query(credentials, opportunity_query)
        customers = [
            {
                "external_ref": f"salesforce:Account:{record['Id']}",
                "name": record.get("Name") or f"Salesforce Account {record['Id']}",
                "region": record.get("BillingCountry"),
                "business_unit": record.get("Industry"),
                "metadata": {"lastModifiedAt": record.get("LastModifiedDate")},
            }
            for record in accounts
        ]
        sales_orders = [
            {
                "external_ref": f"salesforce:Opportunity:{record['Id']}",
                "customer_external_ref": (
                    f"salesforce:Account:{record['AccountId']}" if record.get("AccountId") else None
                ),
                "order_number": record.get("Name") or str(record["Id"]),
                "status": record.get("StageName") or "Unknown",
                "order_date": _parse_datetime(record.get("CloseDate")),
                "total_amount_cents": _money_to_cents(record.get("Amount")),
                "currency": "USD",
                "metadata": {"lastModifiedAt": record.get("LastModifiedDate")},
            }
            for record in opportunities
        ]
        return ProviderSyncResult(
            customers=customers,
            sales_orders=sales_orders,
            cursor={"watermark": _next_watermark()},
            credentials=credentials,
        )

    async def _query(
        self,
        credentials: dict[str, object],
        query: str,
    ) -> list[dict[str, object]]:
        instance_url = _required_string(credentials, "instance_url")
        access_token = _required_string(credentials, "access_token")
        url = f"{instance_url}/services/data/{self.api_version}/query"
        params: dict[str, str] | None = {"q": query}
        records: list[dict[str, object]] = []
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            while url:
                payload = await _request_json(
                    client,
                    "GET",
                    url,
                    headers={"Authorization": f"Bearer {access_token}"},
                    params=params,
                )
                records.extend(payload.get("records", []))
                next_url = payload.get("nextRecordsUrl")
                url = f"{instance_url}{next_url}" if next_url else ""
                params = None
        return records

    async def _refresh(self, credentials: dict[str, object]) -> None:
        refresh_token = _required_string(credentials, "refresh_token")
        self._require_configuration()
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            response = await client.post(
                f"{self.login_url}/services/oauth2/token",
                data={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": refresh_token,
                },
            )
            response.raise_for_status()
            payload = response.json()
        credentials["access_token"] = payload["access_token"]
        credentials["instance_url"] = payload.get("instance_url", credentials.get("instance_url"))
        credentials["issued_at"] = payload.get("issued_at")

    def _require_configuration(self) -> None:
        if not self.client_id or not self.client_secret or not self.redirect_uri:
            raise ValueError("Salesforce OAuth credentials are not configured.")


class HubSpotConnector(CrmConnector):
    provider = "hubspot"

    def __init__(self, settings: Settings) -> None:
        self.client_id = settings.crm_hubspot_client_id
        self.client_secret = settings.crm_hubspot_client_secret
        self.redirect_uri = settings.crm_hubspot_redirect_uri
        self.api_url = "https://api.hubapi.com"

    def authorization_url(self, *, state: str, code_challenge: str | None = None) -> str:
        self._require_configuration()
        query = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "oauth crm.objects.companies.read crm.objects.deals.read",
            "state": state,
        }
        return f"https://app.hubspot.com/oauth/authorize?{urlencode(query)}"

    async def exchange_code(
        self,
        *,
        code: str,
        code_verifier: str | None = None,
    ) -> dict[str, object]:
        self._require_configuration()
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            response = await client.post(
                f"{self.api_url}/oauth/v3/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "code": code,
                },
            )
            response.raise_for_status()
            payload = response.json()
        return self._token_payload(payload)

    async def discover_schema(self, credentials: dict[str, object]) -> ConnectorSchema:
        await self._ensure_fresh(credentials)
        access_token = _required_string(credentials, "access_token")
        fields: dict[str, list[str]] = {}
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            for entity in ("companies", "deals"):
                payload = await _request_json(
                    client,
                    "GET",
                    f"{self.api_url}/crm/v3/properties/{entity}",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                fields[entity] = [str(field["name"]) for field in payload.get("results", [])]
        return ConnectorSchema(provider=self.provider, entities=list(fields), fields=fields)

    async def sync_incremental(
        self,
        credentials: dict[str, object],
        cursor: dict[str, object],
    ) -> ProviderSyncResult:
        await self._ensure_fresh(credentials)
        watermark = _cursor_watermark(cursor)
        companies = await self._search(
            credentials,
            "companies",
            ["name", "country", "industry", "hs_lastmodifieddate"],
            watermark,
        )
        deals = await self._search(
            credentials,
            "deals",
            [
                "dealname",
                "amount",
                "closedate",
                "dealstage",
                "hs_currency_code",
                "hs_lastmodifieddate",
            ],
            watermark,
        )
        associations = await self._deal_company_associations(
            credentials,
            [str(record["id"]) for record in deals],
        )
        customers = [
            {
                "external_ref": f"hubspot:company:{record['id']}",
                "name": record.get("properties", {}).get("name") or f"HubSpot Company {record['id']}",
                "region": record.get("properties", {}).get("country"),
                "business_unit": record.get("properties", {}).get("industry"),
                "metadata": {"lastModifiedAt": record.get("updatedAt")},
            }
            for record in companies
        ]
        sales_orders = []
        for record in deals:
            properties = record.get("properties", {})
            company_id = associations.get(str(record["id"]))
            sales_orders.append(
                {
                    "external_ref": f"hubspot:deal:{record['id']}",
                    "customer_external_ref": f"hubspot:company:{company_id}" if company_id else None,
                    "order_number": properties.get("dealname") or str(record["id"]),
                    "status": properties.get("dealstage") or "Unknown",
                    "order_date": _parse_datetime(properties.get("closedate")),
                    "total_amount_cents": _money_to_cents(properties.get("amount")),
                    "currency": (properties.get("hs_currency_code") or "USD")[:3].upper(),
                    "metadata": {"lastModifiedAt": record.get("updatedAt")},
                }
            )
        return ProviderSyncResult(
            customers=customers,
            sales_orders=sales_orders,
            cursor={"watermark": _next_watermark()},
            credentials=credentials,
        )

    async def _search(
        self,
        credentials: dict[str, object],
        entity: str,
        properties: list[str],
        watermark: str | None,
    ) -> list[dict[str, object]]:
        access_token = _required_string(credentials, "access_token")
        after: str | None = None
        records: list[dict[str, object]] = []
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            while True:
                body: dict[str, object] = {
                    "limit": 200,
                    "properties": properties,
                    "sorts": ["hs_lastmodifieddate"],
                }
                if watermark:
                    body["filterGroups"] = [
                        {
                            "filters": [
                                {
                                    "propertyName": "hs_lastmodifieddate",
                                    "operator": "GT",
                                    "value": str(_epoch_milliseconds(watermark)),
                                }
                            ]
                        }
                    ]
                if after:
                    body["after"] = after
                payload = await _request_json(
                    client,
                    "POST",
                    f"{self.api_url}/crm/v3/objects/{entity}/search",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=body,
                )
                records.extend(payload.get("results", []))
                after_value = payload.get("paging", {}).get("next", {}).get("after")
                if not after_value:
                    break
                after = str(after_value)
        return records

    async def _deal_company_associations(
        self,
        credentials: dict[str, object],
        deal_ids: list[str],
    ) -> dict[str, str]:
        if not deal_ids:
            return {}
        access_token = _required_string(credentials, "access_token")
        associations: dict[str, str] = {}
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            for start in range(0, len(deal_ids), 100):
                chunk = deal_ids[start : start + 100]
                try:
                    payload = await _request_json(
                        client,
                        "POST",
                        f"{self.api_url}/crm/v4/associations/deals/companies/batch/read",
                        headers={"Authorization": f"Bearer {access_token}"},
                        json={"inputs": [{"id": deal_id} for deal_id in chunk]},
                    )
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code in {403, 404}:
                        return associations
                    raise
                for result in payload.get("results", []):
                    source_id = str(result.get("from", {}).get("id", ""))
                    targets = result.get("to", [])
                    if source_id and targets:
                        associations[source_id] = str(targets[0].get("toObjectId"))
        return associations

    async def _ensure_fresh(self, credentials: dict[str, object]) -> None:
        expires_at = _parse_datetime(credentials.get("expires_at"))
        if expires_at and expires_at > datetime.now(UTC) + timedelta(seconds=60):
            return
        refresh_token = _required_string(credentials, "refresh_token")
        self._require_configuration()
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            response = await client.post(
                f"{self.api_url}/oauth/v3/token",
                data={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": refresh_token,
                },
            )
            response.raise_for_status()
            payload = response.json()
        refreshed = self._token_payload(payload)
        if not refreshed.get("refresh_token"):
            refreshed["refresh_token"] = refresh_token
        credentials.update(refreshed)

    def _token_payload(self, payload: dict[str, object]) -> dict[str, object]:
        expires_in = int(payload.get("expires_in", 1800))
        hub_id = payload.get("hub_id") or payload.get("hubId")
        return {
            "access_token": payload["access_token"],
            "refresh_token": payload.get("refresh_token"),
            "expires_at": (datetime.now(UTC) + timedelta(seconds=expires_in)).isoformat(),
            "external_account_id": str(hub_id) if hub_id is not None else None,
            "scopes": payload.get("scopes", []),
            "token_type": payload.get("token_type", "bearer"),
        }

    def _require_configuration(self) -> None:
        if not self.client_id or not self.client_secret or not self.redirect_uri:
            raise ValueError("HubSpot OAuth credentials are not configured.")


async def _request_json(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    **kwargs: object,
) -> dict[str, object]:
    for attempt in range(3):
        response = await client.request(method, url, **kwargs)
        if response.status_code != 429 and response.status_code < 500:
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                raise ValueError("CRM provider returned an invalid response.")
            return payload
        if attempt == 2:
            response.raise_for_status()
        retry_after = min(float(response.headers.get("Retry-After", "1")), 10.0)
        await asyncio.sleep(retry_after)
    raise RuntimeError("CRM provider request failed.")


def _required_string(payload: dict[str, object], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value:
        raise ValueError(f"Connector credential is missing {key}.")
    return value


def _cursor_watermark(cursor: dict[str, object]) -> str | None:
    value = cursor.get("watermark")
    return str(value) if value else None


def _next_watermark() -> str:
    return (datetime.now(UTC) - timedelta(minutes=2)).isoformat().replace("+00:00", "Z")


def _epoch_milliseconds(value: str) -> int:
    parsed = _parse_datetime(value)
    if not parsed:
        raise ValueError("Connector cursor has an invalid watermark.")
    return int(parsed.timestamp() * 1000)


def _parse_datetime(value: object) -> datetime | None:
    if not value:
        return None
    normalized = str(value).strip()
    if normalized.isdigit():
        return datetime.fromtimestamp(int(normalized) / 1000, tz=UTC)
    if len(normalized) == 10:
        normalized = f"{normalized}T00:00:00+00:00"
    elif normalized.endswith("Z"):
        normalized = f"{normalized[:-1]}+00:00"
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed.astimezone(UTC)


def _money_to_cents(value: object) -> int:
    if value in {None, ""}:
        return 0
    try:
        return int((Decimal(str(value)) * 100).quantize(Decimal(1)))
    except (InvalidOperation, ValueError):
        return 0
