from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision = "0003_bank_ingestion"
down_revision = "0002_connector_oauth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    table_names = set(inspect(bind).get_table_names())

    if "bank_accounts" not in table_names:
        op.create_table(
            "bank_accounts",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("tenant_id", sa.String(length=64), nullable=False),
            sa.Column("connector_id", sa.String(length=64), nullable=False),
            sa.Column("external_ref", sa.String(length=180), nullable=False),
            sa.Column("institution_name", sa.String(length=180), nullable=False),
            sa.Column("account_name", sa.String(length=180), nullable=False),
            sa.Column("account_number_last4", sa.String(length=4)),
            sa.Column("currency", sa.String(length=3), nullable=False, server_default="PKR"),
            sa.Column("current_balance_cents", sa.BigInteger()),
            sa.Column("last_transaction_at", sa.DateTime(timezone=True)),
            sa.Column("metadata_json", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["connector_id"], ["connectors.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "tenant_id", "external_ref", name="uq_bank_accounts_external_ref"
            ),
        )
        op.create_index("ix_bank_accounts_connector_id", "bank_accounts", ["connector_id"])
        op.create_index("ix_bank_accounts_tenant_id", "bank_accounts", ["tenant_id"])

    table_names = set(inspect(bind).get_table_names())
    if "bank_statement_imports" not in table_names:
        op.create_table(
            "bank_statement_imports",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("tenant_id", sa.String(length=64), nullable=False),
            sa.Column("connector_id", sa.String(length=64), nullable=False),
            sa.Column("bank_account_id", sa.String(length=64), nullable=False),
            sa.Column("file_name", sa.String(length=255), nullable=False),
            sa.Column("file_sha256", sa.String(length=64), nullable=False),
            sa.Column("status", sa.String(length=40), nullable=False, server_default="completed"),
            sa.Column("total_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("imported_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("duplicate_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("rejected_rows", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("mapping_json", sa.JSON(), nullable=False),
            sa.Column("created_by_user_id", sa.String(length=64), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True)),
            sa.ForeignKeyConstraint(
                ["bank_account_id"], ["bank_accounts.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(["connector_id"], ["connectors.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "tenant_id",
                "bank_account_id",
                "file_sha256",
                name="uq_bank_statement_import_file",
            ),
        )
        op.create_index(
            "ix_bank_statement_imports_bank_account_id",
            "bank_statement_imports",
            ["bank_account_id"],
        )
        op.create_index(
            "ix_bank_statement_imports_connector_id",
            "bank_statement_imports",
            ["connector_id"],
        )
        op.create_index(
            "ix_bank_statement_imports_tenant_id", "bank_statement_imports", ["tenant_id"]
        )

    table_names = set(inspect(bind).get_table_names())
    if "bank_transactions" not in table_names:
        op.create_table(
            "bank_transactions",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("tenant_id", sa.String(length=64), nullable=False),
            sa.Column("bank_account_id", sa.String(length=64), nullable=False),
            sa.Column("statement_import_id", sa.String(length=64), nullable=False),
            sa.Column("external_ref", sa.String(length=180), nullable=False),
            sa.Column("transaction_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=False),
            sa.Column("reference", sa.String(length=180)),
            sa.Column("amount_cents", sa.BigInteger(), nullable=False),
            sa.Column("balance_cents", sa.BigInteger()),
            sa.Column("currency", sa.String(length=3), nullable=False, server_default="PKR"),
            sa.Column("metadata_json", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(
                ["bank_account_id"], ["bank_accounts.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(
                ["statement_import_id"], ["bank_statement_imports.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "tenant_id", "external_ref", name="uq_bank_transactions_external_ref"
            ),
        )
        op.create_index(
            "ix_bank_transactions_bank_account_id", "bank_transactions", ["bank_account_id"]
        )
        op.create_index(
            "ix_bank_transactions_statement_import_id",
            "bank_transactions",
            ["statement_import_id"],
        )
        op.create_index(
            "ix_bank_transactions_tenant_date",
            "bank_transactions",
            ["tenant_id", "transaction_date"],
        )


def downgrade() -> None:
    table_names = set(inspect(op.get_bind()).get_table_names())
    for table_name in ("bank_transactions", "bank_statement_imports", "bank_accounts"):
        if table_name in table_names:
            op.drop_table(table_name)
