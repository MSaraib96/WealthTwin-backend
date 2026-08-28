from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

PASSWORD_ITERATIONS = 260_000


def utc_now() -> datetime:
    return datetime.now(UTC)


def hash_password(password: str, salt: str | None = None) -> str:
    salt_bytes = base64.urlsafe_b64decode(salt.encode()) if salt else secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_bytes,
        PASSWORD_ITERATIONS,
    )
    encoded_salt = base64.urlsafe_b64encode(salt_bytes).decode()
    encoded_hash = base64.urlsafe_b64encode(password_hash).decode()
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${encoded_salt}${encoded_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = stored_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256" or int(iterations) != PASSWORD_ITERATIONS:
        return False

    actual = hash_password(password, salt).split("$", 3)[3]
    return hmac.compare_digest(actual, expected)


def new_token(prefix: str) -> str:
    return f"{prefix}_{secrets.token_urlsafe(32)}"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def new_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def verify_totp(secret: str, code: str, *, at_time: int | None = None, window: int = 1) -> bool:
    if not code.isdigit() or len(code) != 6:
        return False
    timestamp = int(time.time()) if at_time is None else at_time
    for offset in range(-window, window + 1):
        counter = (timestamp // 30) + offset
        padding = "=" * ((8 - len(secret) % 8) % 8)
        key = base64.b32decode(secret + padding, casefold=True)
        digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
        index = digest[-1] & 0x0F
        value = struct.unpack(">I", digest[index : index + 4])[0] & 0x7FFFFFFF
        expected = f"{value % 1_000_000:06d}"
        if hmac.compare_digest(expected, code):
            return True
    return False


def new_recovery_codes(count: int = 8) -> list[str]:
    return [f"WT-{secrets.token_hex(3).upper()}-{secrets.token_hex(3).upper()}" for _ in range(count)]


@dataclass(frozen=True)
class TokenTtl:
    issued_at: datetime
    expires_at: datetime

    @classmethod
    def from_seconds(cls, seconds: int) -> TokenTtl:
        issued = utc_now()
        return cls(issued_at=issued, expires_at=issued + timedelta(seconds=seconds))

    @property
    def expired(self) -> bool:
        return utc_now() >= self.expires_at
