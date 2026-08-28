from __future__ import annotations

import csv
import hashlib
import io
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.service import RequestContext
from app.core.security import utc_now
from app.db.models import (
    BankAccount,
    BankStatementImport,
    BankTransaction,
    Connector,
    ConnectorStatus,
    SecurityEvent,
)
from app.domain.connectors import connector_service

HEADER_ALIASES: dict[str, tuple[str, ...]] = {
    "date": (
        "date",
        "transaction date",
        "txn date",
        "posting date",
        "posted date",
        "value date",
    ),
    "description": (
        "description",
        "narration",
        "details",
        "particulars",
        "transaction details",
        "remarks",
        "memo",
    ),
    "amount": ("amount", "transaction amount", "txn amount"),
    "debit": ("debit", "debit amount", "withdrawal", "withdrawals", "money out"),
    "credit": ("credit", "credit amount", "deposit", "deposits", "money in"),
    "balance": ("balance", "running balance", "closing balance", "available balance"),
    "reference": (
        "reference",
        "reference number",
        "transaction id",
        "txn id",
        "cheque number",
        "cheque no",
        "instrument number",
    ),
}

DATE_FORMATS = (
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d/%m/%y",
    "%d-%m-%y",
    "%d %b %Y",
    "%d-%b-%Y",
    "%d %B %Y",
    "%m/%d/%Y",
)


class BankCsvValidationError(ValueError):
    def __init__(self, message: str, *, row_errors: list[str] | None = None) -> None:
        super().__init__(message)
        self.row_errors = row_errors or []


@dataclass(frozen=True)
class ParsedBankTransaction:
    row_number: int
    transaction_date: datetime
    description: str
    reference: str | None
    amount_cents: int
    balance_cents: int | None


@dataclass(frozen=True)
class ParsedBankStatement:
    rows: list[ParsedBankTransaction]
    mapping: dict[str, str]


class BankImportService:
    def parse_csv(self, content: bytes, *, max_rows: int) -> ParsedBankStatement:
        text = _decode_csv(content)
        try:
            dialect = csv.Sniffer().sniff(text[:8192], delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel

        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        if not reader.fieldnames:
            raise BankCsvValidationError("The CSV file does not contain a header row.")
        mapping = _resolve_mapping(reader.fieldnames)
        _validate_mapping(mapping)

        parsed_rows: list[ParsedBankTransaction] = []
        errors: list[str] = []
        discovered_rows = 0
        for row_number, source_row in enumerate(reader, start=2):
            if not any(str(value or "").strip() for value in source_row.values()):
                continue
            discovered_rows += 1
            if discovered_rows > max_rows:
                raise BankCsvValidationError(
                    f"The statement exceeds the limit of {max_rows:,} transaction rows."
                )
            try:
                parsed_rows.append(_parse_row(source_row, mapping, row_number))
            except ValueError as exc:
                if len(errors) < 20:
                    errors.append(f"Row {row_number}: {exc}")

        if errors:
            raise BankCsvValidationError(
                "The statement contains invalid rows. No transactions were imported.",
                row_errors=errors,
            )
        if not parsed_rows:
            raise BankCsvValidationError("The CSV file does not contain any transaction rows.")
        return ParsedBankStatement(rows=parsed_rows, mapping=mapping)

    def import_statement(
        self,
        *,
        db: Session,
        context: RequestContext,
        file_name: str,
        content: bytes,
        institution_name: str,
        account_name: str,
        account_number_last4: str | None,
        currency: str,
        max_rows: int,
    ) -> dict[str, object]:
        parsed = self.parse_csv(content, max_rows=max_rows)
        connector_service.ensure_tenant(db, context)
        connector = self._bank_connector(db, context.tenant.id)
        account = self._bank_account(
            db,
            tenant_id=context.tenant.id,
            connector=connector,
            institution_name=institution_name,
            account_name=account_name,
            account_number_last4=account_number_last4,
            currency=currency,
        )

        file_hash = hashlib.sha256(content).hexdigest()
        existing_import = db.scalar(
            select(BankStatementImport).where(
                BankStatementImport.tenant_id == context.tenant.id,
                BankStatementImport.bank_account_id == account.id,
                BankStatementImport.file_sha256 == file_hash,
            )
        )
        if existing_import:
            return self._import_response(
                existing_import,
                account,
                connector,
                already_imported=True,
            )

        statement_import = BankStatementImport(
            tenant_id=context.tenant.id,
            connector_id=connector.id,
            bank_account_id=account.id,
            file_name=file_name,
            file_sha256=file_hash,
            status="processing",
            total_rows=len(parsed.rows),
            mapping_json=parsed.mapping,
            created_by_user_id=context.user.id,
        )
        db.add(statement_import)
        db.flush()

        fingerprints = _transaction_fingerprints(account.external_ref, parsed.rows)
        existing_refs = self._existing_transaction_refs(db, context.tenant.id, fingerprints)
        imported_rows = 0
        duplicate_rows = 0
        for row, external_ref in zip(parsed.rows, fingerprints, strict=True):
            if external_ref in existing_refs:
                duplicate_rows += 1
                continue
            db.add(
                BankTransaction(
                    tenant_id=context.tenant.id,
                    bank_account_id=account.id,
                    statement_import_id=statement_import.id,
                    external_ref=external_ref,
                    transaction_date=row.transaction_date,
                    description=row.description,
                    reference=row.reference,
                    amount_cents=row.amount_cents,
                    balance_cents=row.balance_cents,
                    currency=currency,
                    metadata_json={"source": "csv", "sourceRow": row.row_number},
                )
            )
            imported_rows += 1

        previous_last_transaction = account.last_transaction_at
        latest_transaction = max(parsed.rows, key=lambda item: (item.transaction_date, item.row_number))
        latest_with_balance = max(
            (row for row in parsed.rows if row.balance_cents is not None),
            key=lambda item: (item.transaction_date, item.row_number),
            default=None,
        )
        if not previous_last_transaction or latest_transaction.transaction_date >= _as_utc(
            previous_last_transaction
        ):
            account.last_transaction_at = latest_transaction.transaction_date
        if latest_with_balance and (
            previous_last_transaction is None
            or latest_with_balance.transaction_date >= _as_utc(previous_last_transaction)
        ):
            account.current_balance_cents = latest_with_balance.balance_cents

        statement_import.status = "completed"
        statement_import.imported_rows = imported_rows
        statement_import.duplicate_rows = duplicate_rows
        statement_import.completed_at = utc_now()
        connector.status = ConnectorStatus.connected
        connector.last_sync_at = utc_now()
        connector.schema_snapshot = {
            "provider": "bank_csv",
            "entities": ["BankAccount", "BankTransaction"],
            "mapping": parsed.mapping,
            "currency": currency,
            "lastFileName": file_name,
        }
        connector.records_processed = self._transaction_count(db, connector.id) + imported_rows
        connector.external_account_id = f"{self._account_count(db, connector.id)} account(s)"
        connector.errors = 0
        db.add(
            SecurityEvent(
                tenant_id=context.tenant.id,
                user_id=context.user.id,
                event_type="BANK_STATEMENT_IMPORTED",
                metadata_json={
                    "connectorId": connector.id,
                    "bankAccountId": account.id,
                    "fileSha256": file_hash,
                    "rowsImported": imported_rows,
                    "duplicatesSkipped": duplicate_rows,
                },
            )
        )
        db.commit()
        db.refresh(statement_import)
        db.refresh(account)
        db.refresh(connector)
        return self._import_response(statement_import, account, connector, already_imported=False)

    def overview(self, db: Session, tenant_id: str) -> dict[str, object]:
        connector = db.scalar(
            select(Connector).where(
                Connector.tenant_id == tenant_id,
                Connector.provider == "bank_csv",
            )
        )
        if not connector:
            return {"connectorId": None, "accounts": [], "recentImports": []}
        accounts = list(
            db.scalars(
                select(BankAccount)
                .where(
                    BankAccount.tenant_id == tenant_id,
                    BankAccount.connector_id == connector.id,
                )
                .order_by(BankAccount.created_at.asc())
            ).all()
        )
        transaction_counts = dict(
            db.execute(
                select(BankTransaction.bank_account_id, func.count(BankTransaction.id))
                .where(BankTransaction.tenant_id == tenant_id)
                .group_by(BankTransaction.bank_account_id)
            ).all()
        )
        recent_imports = list(
            db.scalars(
                select(BankStatementImport)
                .where(BankStatementImport.tenant_id == tenant_id)
                .order_by(BankStatementImport.created_at.desc())
                .limit(10)
            ).all()
        )
        account_lookup = {account.id: account for account in accounts}
        return {
            "connectorId": connector.id,
            "accounts": [
                {
                    **self._account_public(account),
                    "transactionCount": int(transaction_counts.get(account.id, 0)),
                }
                for account in accounts
            ],
            "recentImports": [
                {
                    "id": statement_import.id,
                    "fileName": statement_import.file_name,
                    "accountName": account_lookup[statement_import.bank_account_id].account_name,
                    "status": statement_import.status,
                    "totalRows": statement_import.total_rows,
                    "importedRows": statement_import.imported_rows,
                    "duplicateRows": statement_import.duplicate_rows,
                    "createdAt": statement_import.created_at.isoformat(),
                }
                for statement_import in recent_imports
                if statement_import.bank_account_id in account_lookup
            ],
        }

    def _bank_connector(self, db: Session, tenant_id: str) -> Connector:
        connector = db.scalar(
            select(Connector).where(
                Connector.tenant_id == tenant_id,
                Connector.provider == "bank_csv",
            )
        )
        if connector:
            return connector
        connector = Connector(
            tenant_id=tenant_id,
            provider="bank_csv",
            status=ConnectorStatus.connected,
            sync_mode="manual_csv",
            schema_snapshot={},
            sync_cursor={},
            records_processed=0,
            errors=0,
        )
        db.add(connector)
        db.flush()
        return connector

    def _bank_account(
        self,
        db: Session,
        *,
        tenant_id: str,
        connector: Connector,
        institution_name: str,
        account_name: str,
        account_number_last4: str | None,
        currency: str,
    ) -> BankAccount:
        identity = "|".join(
            value.strip().lower()
            for value in (institution_name, account_name, account_number_last4 or "")
        )
        external_ref = f"bank_csv:{hashlib.sha256(identity.encode()).hexdigest()[:32]}"
        account = db.scalar(
            select(BankAccount).where(
                BankAccount.tenant_id == tenant_id,
                BankAccount.external_ref == external_ref,
            )
        )
        if account:
            if account.currency != currency:
                raise BankCsvValidationError(
                    f"This account was previously imported as {account.currency}; currency cannot be changed."
                )
            return account
        account = BankAccount(
            tenant_id=tenant_id,
            connector_id=connector.id,
            external_ref=external_ref,
            institution_name=institution_name,
            account_name=account_name,
            account_number_last4=account_number_last4,
            currency=currency,
            metadata_json={"connectionType": "statement_csv"},
        )
        db.add(account)
        db.flush()
        return account

    def _existing_transaction_refs(
        self,
        db: Session,
        tenant_id: str,
        external_refs: list[str],
    ) -> set[str]:
        existing: set[str] = set()
        for start in range(0, len(external_refs), 500):
            chunk = external_refs[start : start + 500]
            existing.update(
                db.scalars(
                    select(BankTransaction.external_ref).where(
                        BankTransaction.tenant_id == tenant_id,
                        BankTransaction.external_ref.in_(chunk),
                    )
                ).all()
            )
        return existing

    def _transaction_count(self, db: Session, connector_id: str) -> int:
        count = db.scalar(
            select(func.count(BankTransaction.id))
            .join(BankAccount, BankAccount.id == BankTransaction.bank_account_id)
            .where(BankAccount.connector_id == connector_id)
        )
        return int(count or 0)

    def _account_count(self, db: Session, connector_id: str) -> int:
        count = db.scalar(
            select(func.count(BankAccount.id)).where(BankAccount.connector_id == connector_id)
        )
        return int(count or 0)

    def _import_response(
        self,
        statement_import: BankStatementImport,
        account: BankAccount,
        connector: Connector,
        *,
        already_imported: bool,
    ) -> dict[str, object]:
        return {
            "importId": statement_import.id,
            "connectorId": connector.id,
            "alreadyImported": already_imported,
            "fileName": statement_import.file_name,
            "totalRows": statement_import.total_rows,
            "importedRows": statement_import.imported_rows,
            "duplicateRows": statement_import.duplicate_rows,
            "rejectedRows": statement_import.rejected_rows,
            "mapping": statement_import.mapping_json,
            "importedAt": statement_import.created_at.isoformat(),
            "account": self._account_public(account),
        }

    def _account_public(self, account: BankAccount) -> dict[str, object]:
        return {
            "id": account.id,
            "institutionName": account.institution_name,
            "accountName": account.account_name,
            "accountNumberLast4": account.account_number_last4,
            "currency": account.currency,
            "currentBalanceCents": account.current_balance_cents,
            "lastTransactionAt": (
                account.last_transaction_at.isoformat() if account.last_transaction_at else None
            ),
        }


def _decode_csv(content: bytes) -> str:
    if not content:
        raise BankCsvValidationError("The selected CSV file is empty.")
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise BankCsvValidationError("The CSV file must use UTF-8 or Windows-1252 encoding.")


def _normalized_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.strip().lower()).strip()


def _resolve_mapping(fieldnames: list[str]) -> dict[str, str]:
    normalized = {_normalized_header(field): field for field in fieldnames if field}
    mapping: dict[str, str] = {}
    for canonical, aliases in HEADER_ALIASES.items():
        for alias in aliases:
            source = normalized.get(alias)
            if source:
                mapping[canonical] = source
                break
    return mapping


def _validate_mapping(mapping: dict[str, str]) -> None:
    missing = [field for field in ("date", "description") if field not in mapping]
    has_amount = "amount" in mapping or "debit" in mapping or "credit" in mapping
    if not has_amount:
        missing.append("amount or debit/credit")
    if missing:
        raise BankCsvValidationError(
            "Required CSV columns were not recognized: " + ", ".join(missing) + "."
        )


def _parse_row(
    source_row: dict[str | None, str | None],
    mapping: dict[str, str],
    row_number: int,
) -> ParsedBankTransaction:
    transaction_date = _parse_date(_value(source_row, mapping["date"]))
    description = _value(source_row, mapping["description"]).strip()
    if not description:
        raise ValueError("description is required")
    if len(description) > 500:
        raise ValueError("description exceeds 500 characters")

    reference = _value(source_row, mapping.get("reference")).strip() or None
    if reference and len(reference) > 180:
        raise ValueError("reference exceeds 180 characters")

    if "amount" in mapping:
        amount = _parse_money(_value(source_row, mapping["amount"]), required=True)
        assert amount is not None
    else:
        debit = _parse_money(_value(source_row, mapping.get("debit")), required=False)
        credit = _parse_money(_value(source_row, mapping.get("credit")), required=False)
        debit_value = abs(debit or 0)
        credit_value = abs(credit or 0)
        if debit_value and credit_value:
            raise ValueError("debit and credit cannot both contain an amount")
        if not debit_value and not credit_value:
            raise ValueError("debit or credit amount is required")
        amount = credit_value - debit_value
    if amount == 0:
        raise ValueError("transaction amount cannot be zero")

    balance = _parse_money(_value(source_row, mapping.get("balance")), required=False)
    return ParsedBankTransaction(
        row_number=row_number,
        transaction_date=transaction_date,
        description=description,
        reference=reference,
        amount_cents=amount,
        balance_cents=balance,
    )


def _value(row: dict[str | None, str | None], source: str | None) -> str:
    if not source:
        return ""
    return str(row.get(source) or "")


def _parse_date(raw: str) -> datetime:
    value = raw.strip()
    if not value:
        raise ValueError("transaction date is required")
    iso_value = value.replace("Z", "+00:00")
    try:
        parsed_iso = datetime.fromisoformat(iso_value)
        if parsed_iso.tzinfo:
            return parsed_iso.astimezone(UTC)
        return parsed_iso.replace(tzinfo=UTC)
    except ValueError:
        pass
    for date_format in DATE_FORMATS:
        try:
            return datetime.strptime(value, date_format).replace(tzinfo=UTC)
        except ValueError:
            continue
    raise ValueError(f"unsupported transaction date '{value}'")


def _parse_money(raw: str, *, required: bool) -> int | None:
    value = raw.strip()
    if not value or value in {"-", "--"}:
        if required:
            raise ValueError("transaction amount is required")
        return None
    normalized = value.upper().replace("\u00a0", " ").strip()
    negative = normalized.startswith("(") and normalized.endswith(")")
    if negative:
        normalized = normalized[1:-1]
    if normalized.endswith((" DR", "DR")):
        negative = True
        normalized = re.sub(r"\s*DR$", "", normalized)
    elif normalized.endswith((" CR", "CR")):
        normalized = re.sub(r"\s*CR$", "", normalized)
    normalized = re.sub(r"\b(PKR|RS\.?|RUPEES?)\b", "", normalized)
    normalized = normalized.replace("₨", "").replace(",", "").replace(" ", "")
    try:
        amount = Decimal(normalized)
    except InvalidOperation as exc:
        raise ValueError(f"invalid monetary value '{value}'") from exc
    if negative:
        amount = -abs(amount)
    rounded = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if rounded != amount:
        raise ValueError(f"monetary value '{value}' has more than two decimal places")
    return int(rounded * 100)


def _transaction_fingerprints(
    account_external_ref: str,
    rows: list[ParsedBankTransaction],
) -> list[str]:
    occurrences: defaultdict[str, int] = defaultdict(int)
    fingerprints: list[str] = []
    for row in rows:
        base = "|".join(
            (
                account_external_ref,
                row.transaction_date.isoformat(),
                str(row.amount_cents),
                _normalized_text(row.description),
                _normalized_text(row.reference or ""),
                str(row.balance_cents) if row.balance_cents is not None else "",
            )
        )
        ordinal = occurrences[base]
        occurrences[base] += 1
        digest = hashlib.sha256(f"{base}|{ordinal}".encode()).hexdigest()
        fingerprints.append(f"bank_csv:{digest}")
    return fingerprints


def _normalized_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


bank_import_service = BankImportService()
