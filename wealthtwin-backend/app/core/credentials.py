from __future__ import annotations

import json

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import Settings


class CredentialEncryptionError(ValueError):
    pass


class CredentialCipher:
    def __init__(self, key: str) -> None:
        try:
            self._fernet = Fernet(key.encode("ascii"))
        except (ValueError, UnicodeEncodeError) as exc:
            raise CredentialEncryptionError(
                "WEALTHTWIN_CREDENTIAL_ENCRYPTION_KEY must be a valid Fernet key."
            ) from exc

    @classmethod
    def from_settings(cls, settings: Settings) -> CredentialCipher:
        if not settings.credential_encryption_key:
            raise CredentialEncryptionError(
                "WEALTHTWIN_CREDENTIAL_ENCRYPTION_KEY is required for CRM connections."
            )
        return cls(settings.credential_encryption_key)

    def encrypt(self, payload: dict[str, object]) -> str:
        serialized = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
        return self._fernet.encrypt(serialized).decode("ascii")

    def decrypt(self, encrypted_payload: str) -> dict[str, object]:
        try:
            serialized = self._fernet.decrypt(encrypted_payload.encode("ascii"))
            payload = json.loads(serialized)
        except (InvalidToken, UnicodeEncodeError, json.JSONDecodeError) as exc:
            raise CredentialEncryptionError("Stored connector credentials cannot be decrypted.") from exc
        if not isinstance(payload, dict):
            raise CredentialEncryptionError("Stored connector credentials have an invalid format.")
        return payload
