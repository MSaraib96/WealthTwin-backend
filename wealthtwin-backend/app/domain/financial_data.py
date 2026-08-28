from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.permissions import Permission
from app.auth.service import RequestContext
from app.db.models import (
    Alert,
    BankAccount,
    BankTransaction,
    Connector,
    Customer,
    Dashboard,
    Invoice,
    MetricDefinition,
    Payment,
    SalesOrder,
    SecurityEvent,
    SyncRun,
)


def _count(db: Session, model: type, tenant_id: str) -> int:
    value = db.scalar(select(func.count()).select_from(model).where(model.tenant_id == tenant_id))
    return int(value or 0)


def _sum_cents(db: Session, column: object, model: type, tenant_id: str) -> int:
    value = db.scalar(select(func.coalesce(func.sum(column), 0)).where(model.tenant_id == tenant_id))
    return int(value or 0)


def _format_money(cents: int, currency: str = "USD") -> str:
    symbols = {"USD": "$", "EUR": "EUR ", "GBP": "GBP ", "PKR": "PKR "}
    amount = cents / 100
    prefix = symbols.get(currency, f"{currency} ")
    if abs(amount) >= 1_000_000:
        return f"{prefix}{amount / 1_000_000:.2f}M"
    if abs(amount) >= 1_000:
        return f"{prefix}{amount / 1_000:.1f}K"
    return f"{prefix}{amount:,.2f}"


def _iso(value: datetime | None) -> str | None:
    return value.astimezone(UTC).isoformat() if value else None


def _tenant_summary(db: Session, tenant_id: str) -> dict[str, object]:
    counts = {
        "customers": _count(db, Customer, tenant_id),
        "salesOrders": _count(db, SalesOrder, tenant_id),
        "invoices": _count(db, Invoice, tenant_id),
        "payments": _count(db, Payment, tenant_id),
        "bankAccounts": _count(db, BankAccount, tenant_id),
        "bankTransactions": _count(db, BankTransaction, tenant_id),
    }
    record_count = sum(int(value) for value in counts.values())
    source_count = _count(db, Connector, tenant_id)
    metric_count = _count(db, MetricDefinition, tenant_id)
    last_sync = db.scalar(select(func.max(Connector.last_sync_at)).where(Connector.tenant_id == tenant_id))

    if record_count == 0:
        data_state = "empty"
        data_health = "Waiting for a connected source"
    elif metric_count == 0:
        data_state = "partial"
        data_health = "Records imported; metrics need configuration"
    else:
        data_state = "ready"
        data_health = "Tenant data is available"

    return {
        "dataState": data_state,
        "dataHealth": data_health,
        "recordCount": record_count,
        "sourceCount": source_count,
        "metricCount": metric_count,
        "lastUpdated": _iso(last_sync),
        "entityCounts": counts,
    }


def _order_trajectory(db: Session, tenant_id: str) -> list[dict[str, object]]:
    orders = db.scalars(
        select(SalesOrder)
        .where(SalesOrder.tenant_id == tenant_id, SalesOrder.order_date.is_not(None))
        .order_by(SalesOrder.order_date.asc())
    ).all()
    totals: dict[str, int] = defaultdict(int)
    for order in orders:
        if order.order_date:
            totals[order.order_date.strftime("%Y-%m")] += order.total_amount_cents
    return [
        {"period": period, "actual": round(cents / 100_000_000, 4), "forecast": None, "plan": None}
        for period, cents in sorted(totals.items())
    ]


def _alerts(db: Session, tenant_id: str, limit: int = 20) -> list[dict[str, object]]:
    alerts = db.scalars(
        select(Alert)
        .where(Alert.tenant_id == tenant_id, Alert.status == "open")
        .order_by(Alert.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": alert.id,
            "severity": alert.severity,
            "title": alert.title,
            "description": alert.description,
            "evidence": alert.evidence,
            "createdAt": _iso(alert.created_at),
        }
        for alert in alerts
    ]


def command_center_response(db: Session, context: RequestContext) -> dict[str, object]:
    tenant_id = context.tenant.id
    summary = _tenant_summary(db, tenant_id)
    order_total = _sum_cents(db, SalesOrder.total_amount_cents, SalesOrder, tenant_id)
    outstanding = _sum_cents(db, Invoice.balance_cents, Invoice, tenant_id)
    collections = _sum_cents(db, Payment.amount_cents, Payment, tenant_id)
    invoice_count = int(summary["entityCounts"]["invoices"])
    order_count = int(summary["entityCounts"]["salesOrders"])
    payment_count = int(summary["entityCounts"]["payments"])

    return {
        "tenantId": tenant_id,
        "generatedAt": datetime.now(UTC).isoformat(),
        **summary,
        "workspace": {
            "organization": context.tenant.name,
            "user": context.user.first_name,
            "role": context.user.role,
            "dataScope": context.user.data_scope,
        },
        "kpis": [
            {
                "id": "sales-order-value",
                "label": "Sales order value",
                "value": _format_money(order_total) if order_count else None,
                "context": f"{order_count:,} imported sales orders",
                "available": order_count > 0,
            },
            {
                "id": "outstanding-receivables",
                "label": "Outstanding receivables",
                "value": _format_money(outstanding) if invoice_count else None,
                "context": f"{invoice_count:,} imported invoices",
                "available": invoice_count > 0,
            },
            {
                "id": "collections",
                "label": "Imported collections",
                "value": _format_money(collections) if payment_count else None,
                "context": f"{payment_count:,} imported payments",
                "available": payment_count > 0,
            },
            {
                "id": "connected-sources",
                "label": "Connected sources",
                "value": str(summary["sourceCount"]),
                "context": summary["dataHealth"],
                "available": True,
            },
        ],
        "financialHealth": None,
        "attention": _alerts(db, tenant_id, limit=3),
        "trajectory": _order_trajectory(db, tenant_id),
        "cashForecast": [],
        "aiBrief": None,
        "onboarding": {
            "sourceConnected": int(summary["sourceCount"]) > 0,
            "recordsImported": int(summary["recordCount"]) > 0,
            "metricsConfigured": int(summary["metricCount"]) > 0,
        },
    }


def financial_health_response(db: Session, context: RequestContext) -> dict[str, object]:
    summary = _tenant_summary(db, context.tenant.id)
    return {
        "tenantId": context.tenant.id,
        **summary,
        "financialHealth": None,
        "profitAndLoss": [],
        "marginDrivers": [],
        "deviations": [],
        "requirements": [
            "Approved revenue and expense mappings",
            "Configured P&L metric definitions",
            "At least one completed ingestion run",
        ],
    }


def cash_forecast_response(db: Session, context: RequestContext) -> dict[str, object]:
    tenant_id = context.tenant.id
    summary = _tenant_summary(db, tenant_id)
    now = datetime.now(UTC)
    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.tenant_id == tenant_id, Invoice.balance_cents > 0)
        .order_by(Invoice.due_date.asc().nulls_last())
        .limit(50)
    ).all()
    customer_ids = {invoice.customer_id for invoice in invoices if invoice.customer_id}
    customers = {
        customer.id: customer
        for customer in db.scalars(select(Customer).where(Customer.id.in_(customer_ids))).all()
    } if customer_ids else {}
    receivables = []
    for invoice in invoices:
        due_date = invoice.due_date
        days_overdue = max((now - due_date).days, 0) if due_date else None
        receivables.append(
            {
                "id": invoice.id,
                "invoice": invoice.invoice_number,
                "customer": customers[invoice.customer_id].name if invoice.customer_id in customers else "Unassigned",
                "amount": _format_money(invoice.balance_cents, invoice.currency),
                "daysOverdue": days_overdue,
                "dueDate": _iso(due_date),
                "status": invoice.status,
            }
        )

    bank_accounts = list(
        db.scalars(
            select(BankAccount)
            .where(BankAccount.tenant_id == tenant_id)
            .order_by(BankAccount.institution_name.asc(), BankAccount.account_name.asc())
        ).all()
    )
    balanced_accounts = [
        account for account in bank_accounts if account.current_balance_cents is not None
    ]
    currencies = {account.currency for account in balanced_accounts}
    current_cash = None
    if balanced_accounts and len(currencies) == 1:
        currency = next(iter(currencies))
        current_cash = _format_money(
            sum(int(account.current_balance_cents or 0) for account in balanced_accounts),
            currency,
        )

    return {
        "tenantId": tenant_id,
        **summary,
        "currentCash": current_cash,
        "availableCash": None,
        "minimumProjectedCash": None,
        "safetyThreshold": None,
        "forecast": [],
        "receivables": receivables,
        "bankAccounts": [
            {
                "id": account.id,
                "institutionName": account.institution_name,
                "accountName": account.account_name,
                "accountNumberLast4": account.account_number_last4,
                "balance": (
                    _format_money(account.current_balance_cents, account.currency)
                    if account.current_balance_cents is not None
                    else None
                ),
                "currency": account.currency,
                "lastTransactionAt": _iso(account.last_transaction_at),
            }
            for account in bank_accounts
        ],
        "workingCapital": [],
        "requirements": [
            "A bank statement containing a Balance column" if not current_cash else "Cash forecast assumptions",
            "Approved accounts receivable and payable mappings",
            "Forecast assumptions and a safety threshold",
        ],
    }


def performance_response(db: Session, context: RequestContext) -> dict[str, object]:
    tenant_id = context.tenant.id
    summary = _tenant_summary(db, tenant_id)
    orders = db.scalars(select(SalesOrder).where(SalesOrder.tenant_id == tenant_id)).all()
    customer_ids = {order.customer_id for order in orders if order.customer_id}
    customers = {
        customer.id: customer
        for customer in db.scalars(select(Customer).where(Customer.id.in_(customer_ids))).all()
    } if customer_ids else {}
    by_customer: dict[str, int] = defaultdict(int)
    by_region: dict[str, int] = defaultdict(int)
    total = 0
    for order in orders:
        total += order.total_amount_cents
        customer = customers.get(order.customer_id) if order.customer_id else None
        by_customer[customer.name if customer else "Unassigned"] += order.total_amount_cents
        by_region[customer.region if customer and customer.region else "Unassigned"] += order.total_amount_cents

    concentration = [
        {
            "name": name,
            "value": round(cents / total * 100, 1) if total else 0,
            "amount": _format_money(cents),
        }
        for name, cents in sorted(by_customer.items(), key=lambda item: item[1], reverse=True)[:8]
    ]
    regional = [
        {"region": region, "revenue": round(cents / 100_000_000, 4), "amount": _format_money(cents)}
        for region, cents in sorted(by_region.items(), key=lambda item: item[1], reverse=True)
    ]
    return {
        "tenantId": tenant_id,
        **summary,
        "trajectory": _order_trajectory(db, tenant_id),
        "forecast": None,
        "customerConcentration": concentration,
        "regionalPerformance": regional,
    }


def intelligence_response(db: Session, context: RequestContext) -> dict[str, object]:
    summary = _tenant_summary(db, context.tenant.id)
    return {
        "tenantId": context.tenant.id,
        **summary,
        "alerts": _alerts(db, context.tenant.id),
    }


def explorer_sales_orders_response(db: Session, context: RequestContext) -> dict[str, object]:
    tenant_id = context.tenant.id
    summary = _tenant_summary(db, tenant_id)
    orders = db.scalars(
        select(SalesOrder)
        .where(SalesOrder.tenant_id == tenant_id)
        .order_by(SalesOrder.order_date.desc().nulls_last())
        .limit(100)
    ).all()
    customer_ids = {order.customer_id for order in orders if order.customer_id}
    customers = {
        customer.id: customer
        for customer in db.scalars(select(Customer).where(Customer.id.in_(customer_ids))).all()
    } if customer_ids else {}
    rows = [
        {
            "id": order.id,
            "order": order.order_number,
            "customer": customers[order.customer_id].name if order.customer_id in customers else "Unassigned",
            "amount": _format_money(order.total_amount_cents, order.currency),
            "status": order.status,
            "orderDate": _iso(order.order_date),
        }
        for order in orders
    ]
    return {"tenantId": tenant_id, **summary, "rows": rows}


def control_center_response(db: Session, context: RequestContext) -> dict[str, object]:
    tenant_id = context.tenant.id
    summary = _tenant_summary(db, tenant_id)
    sync_errors = db.scalar(
        select(func.count()).select_from(SyncRun).where(
            SyncRun.tenant_id == tenant_id,
            SyncRun.status == "failed",
        )
    )
    dashboard_count = _count(db, Dashboard, tenant_id)
    alert_count = _count(db, Alert, tenant_id)
    events = db.scalars(
        select(SecurityEvent)
        .where(SecurityEvent.tenant_id == tenant_id)
        .order_by(SecurityEvent.created_at.desc())
        .limit(12)
    ).all()
    return {
        "tenantId": tenant_id,
        **summary,
        "overview": [
            {"label": "Connected sources", "value": str(summary["sourceCount"]), "status": "info"},
            {"label": "Imported records", "value": f"{summary['recordCount']:,}", "status": "healthy" if summary["recordCount"] else "warning"},
            {"label": "Metric definitions", "value": str(summary["metricCount"]), "status": "healthy" if summary["metricCount"] else "warning"},
            {"label": "Sync errors", "value": str(int(sync_errors or 0)), "status": "critical" if sync_errors else "healthy"},
            {"label": "Dashboards", "value": str(dashboard_count), "status": "info"},
            {"label": "Alerts", "value": str(alert_count), "status": "info"},
        ],
        "pendingMappings": [],
        "auditEvents": [
            {
                "id": event.id,
                "eventType": event.event_type,
                "createdAt": _iso(event.created_at),
                "metadata": event.metadata_json,
            }
            for event in events
        ],
    }


def compare_scenario_response(
    db: Session,
    context: RequestContext,
    scenario_name: str,
    assumptions: dict[str, float | int | str | bool],
) -> dict[str, object]:
    summary = _tenant_summary(db, context.tenant.id)
    return {
        "tenantId": context.tenant.id,
        "scenario": scenario_name,
        "assumptions": assumptions,
        "status": "unavailable",
        "result": None,
        "dataState": summary["dataState"],
        "message": "A scenario result will be calculated only after required financial metrics and forecast inputs are configured.",
    }


def privacy_filtered_ai_context(db: Session, context: RequestContext) -> dict[str, object]:
    tenant_id = context.tenant.id
    summary = _tenant_summary(db, tenant_id)
    metrics: dict[str, object] = {}
    if Permission.METRIC_REVENUE_VIEW in context.permissions:
        order_count = int(summary["entityCounts"]["salesOrders"])
        if order_count:
            metrics["salesOrderValue"] = _format_money(
                _sum_cents(db, SalesOrder.total_amount_cents, SalesOrder, tenant_id)
            )
    if Permission.METRIC_CASH_VIEW in context.permissions:
        invoice_count = int(summary["entityCounts"]["invoices"])
        if invoice_count:
            metrics["outstandingReceivables"] = _format_money(
                _sum_cents(db, Invoice.balance_cents, Invoice, tenant_id)
            )
        bank_accounts = list(
            db.scalars(
                select(BankAccount).where(
                    BankAccount.tenant_id == tenant_id,
                    BankAccount.current_balance_cents.is_not(None),
                )
            ).all()
        )
        currencies = {account.currency for account in bank_accounts}
        if bank_accounts and len(currencies) == 1:
            metrics["currentBankCash"] = _format_money(
                sum(int(account.current_balance_cents or 0) for account in bank_accounts),
                next(iter(currencies)),
            )
    return {
        "tenantId": tenant_id,
        "role": context.user.role,
        "dataScope": context.user.data_scope,
        "dataState": summary["dataState"],
        "authorizedMetrics": metrics,
        "privacyFilter": "Only tenant-scoped aggregate metrics authorized for the current role are included.",
    }
