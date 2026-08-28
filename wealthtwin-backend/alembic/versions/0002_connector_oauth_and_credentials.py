from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision = "0002_connector_oauth"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    table_names = set(inspector.get_table_names())

    connector_columns = (
        {column["name"] for column in inspector.get_columns("connectors")}
        if "connectors" in table_names
        else set()
    )
    if "connectors" in table_names:
        with op.batch_alter_table("connectors") as batch:
            if "sync_cursor" not in connector_columns:
                batch.add_column(
                    sa.Column("sync_cursor", sa.JSON(), nullable=False, server_default=sa.text("'{}'"))
                )
            if "external_account_id" not in connector_columns:
                batch.add_column(sa.Column("external_account_id", sa.String(length=180)))

        unique_names = {
            constraint.get("name") for constraint in inspect(bind).get_unique_constraints("connectors")
        }
        if "uq_connectors_tenant_provider" not in unique_names:
            with op.batch_alter_table("connectors") as batch:
                batch.create_unique_constraint(
                    "uq_connectors_tenant_provider", ["tenant_id", "provider"]
                )

    table_names = set(inspect(bind).get_table_names())
    if "connector_credentials" not in table_names:
        op.create_table(
            "connector_credentials",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("connector_id", sa.String(length=64), nullable=False),
            sa.Column("encrypted_payload", sa.Text(), nullable=False),
            sa.Column("key_version", sa.String(length=40), nullable=False, server_default="v1"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["connector_id"], ["connectors.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("connector_id"),
        )

    if "oauth_states" not in table_names:
        op.create_table(
            "oauth_states",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("state_hash", sa.String(length=64), nullable=False),
            sa.Column("tenant_id", sa.String(length=64), nullable=False),
            sa.Column("user_id", sa.String(length=64), nullable=False),
            sa.Column("provider", sa.String(length=80), nullable=False),
            sa.Column("encrypted_code_verifier", sa.Text()),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("consumed_at", sa.DateTime(timezone=True)),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("state_hash"),
        )
        op.create_index("ix_oauth_states_state_hash", "oauth_states", ["state_hash"])
        op.create_index("ix_oauth_states_tenant_id", "oauth_states", ["tenant_id"])


def downgrade() -> None:
    bind = op.get_bind()
    table_names = set(inspect(bind).get_table_names())
    if "oauth_states" in table_names:
        op.drop_index("ix_oauth_states_tenant_id", table_name="oauth_states")
        op.drop_index("ix_oauth_states_state_hash", table_name="oauth_states")
        op.drop_table("oauth_states")
    if "connector_credentials" in table_names:
        op.drop_table("connector_credentials")

    if "connectors" in table_names:
        columns = {column["name"] for column in inspect(bind).get_columns("connectors")}
        with op.batch_alter_table("connectors") as batch:
            if "external_account_id" in columns:
                batch.drop_column("external_account_id")
            if "sync_cursor" in columns:
                batch.drop_column("sync_cursor")
