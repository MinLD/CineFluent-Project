"""add processing status to movie ai analysis

Revision ID: f2b8d3c4a1e5
Revises: e8cf082efcf3
Create Date: 2026-04-22 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f2b8d3c4a1e5"
down_revision = "e8cf082efcf3"
branch_labels = None
depends_on = None


old_status_enum = sa.Enum("READY", "FAILED")
new_status_enum = sa.Enum("PROCESSING", "READY", "FAILED")


def upgrade():
    with op.batch_alter_table("movie_ai_analyses", schema=None) as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=old_status_enum,
            type_=new_status_enum,
            existing_nullable=False,
        )


def downgrade():
    with op.batch_alter_table("movie_ai_analyses", schema=None) as batch_op:
        batch_op.alter_column(
            "status",
            existing_type=new_status_enum,
            type_=old_status_enum,
            existing_nullable=False,
        )
