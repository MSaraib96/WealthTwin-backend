from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "WealthTwin API"
    api_prefix: str = "/api/v1"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://wealthtwin:wealthtwin@localhost:5432/wealthtwin"
    redis_url: str = "redis://localhost:6379/0"
    session_cookie_name: str = "wt_session"
    session_secret_key: str = "change-me-in-production"
    access_token_seconds: int = 900
    allowed_origins: list[str] = ["http://127.0.0.1:3000", "http://localhost:3000"]
    public_app_url: str = "http://127.0.0.1:3000"
    invitation_token_seconds: int = 60 * 60 * 24 * 7
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "security@wealthtwin.local"
    smtp_use_tls: bool = True
    crm_salesforce_client_id: str | None = None
    crm_salesforce_client_secret: str | None = None
    crm_salesforce_redirect_uri: str | None = None
    crm_salesforce_login_url: str = "https://login.salesforce.com"
    crm_salesforce_api_version: str = "v67.0"
    crm_hubspot_client_id: str | None = None
    crm_hubspot_client_secret: str | None = None
    crm_hubspot_redirect_uri: str | None = None
    credential_encryption_key: str | None = None
    oauth_state_seconds: int = 600
    bank_csv_max_bytes: int = 5 * 1024 * 1024
    bank_csv_max_rows: int = 25_000
    llm_provider: str = "qwen"
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    llm_model: str = "qwen-plus"

    model_config = SettingsConfigDict(env_prefix="WEALTHTWIN_", env_file=".env", extra="ignore")

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                return value
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.environment == "production" and self.session_secret_key == "change-me-in-production":
            raise ValueError("WEALTHTWIN_SESSION_SECRET_KEY must be changed in production.")
        crm_configured = bool(
            self.crm_salesforce_client_id
            or self.crm_salesforce_client_secret
            or self.crm_hubspot_client_id
            or self.crm_hubspot_client_secret
        )
        if crm_configured and not self.credential_encryption_key:
            raise ValueError(
                "WEALTHTWIN_CREDENTIAL_ENCRYPTION_KEY is required when CRM OAuth is configured."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
