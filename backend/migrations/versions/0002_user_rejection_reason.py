"""Add administrative rejection reason to users.

Revision ID: 0002_user_rejection_reason
Revises: 0001_initial_schema
"""

from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0002_user_rejection_reason"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "rejection_reason")
