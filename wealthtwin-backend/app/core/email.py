from __future__ import annotations

import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from app.core.config import Settings


@dataclass
class OutboxEmail:
    to: str
    subject: str
    body: str


class EmailService:
    def __init__(self) -> None:
        self.outbox: list[OutboxEmail] = []

    def send_invitation(
        self,
        *,
        settings: Settings,
        to_email: str,
        organization_name: str,
        role: str,
        invitation_url: str,
    ) -> str:
        subject = f"You're invited to WealthTwin for {organization_name}"
        body = (
            f"You have been invited to join {organization_name} as {role}. "
            f"Accept the invitation here: {invitation_url}"
        )
        return self._deliver(settings=settings, to_email=to_email, subject=subject, body=body)

    def send_verification(self, *, settings: Settings, to_email: str, verification_url: str) -> str:
        return self._deliver(
            settings=settings,
            to_email=to_email,
            subject="Verify your WealthTwin email",
            body=f"Verify your work email to activate your WealthTwin account: {verification_url}",
        )

    def send_password_reset(self, *, settings: Settings, to_email: str, reset_url: str) -> str:
        return self._deliver(
            settings=settings,
            to_email=to_email,
            subject="Reset your WealthTwin password",
            body=f"Use this single-use link to reset your WealthTwin password: {reset_url}",
        )

    def _deliver(self, *, settings: Settings, to_email: str, subject: str, body: str) -> str:
        if not settings.smtp_host:
            self.outbox.append(OutboxEmail(to=to_email, subject=subject, body=body))
            return "stored_local_outbox"

        message = EmailMessage()
        message["From"] = settings.smtp_from_email
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as client:
            if settings.smtp_use_tls:
                client.starttls()
            if settings.smtp_username and settings.smtp_password:
                client.login(settings.smtp_username, settings.smtp_password)
            client.send_message(message)
        return "sent"


email_service = EmailService()
