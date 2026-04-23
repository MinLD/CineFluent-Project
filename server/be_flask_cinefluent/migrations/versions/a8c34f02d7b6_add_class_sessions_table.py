"""add class sessions table

Revision ID: a8c34f02d7b6
Revises: e4b7c2d9a831
Create Date: 2026-04-23 14:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "a8c34f02d7b6"
down_revision = "e4b7c2d9a831"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "class_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(), nullable=True),
        sa.Column("grammar_focus", sa.JSON(), nullable=True),
        sa.Column("teacher_notes", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("PLANNED", "COMPLETED", "CANCELLED"),
            nullable=False,
            server_default="PLANNED",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["classroom_id"], ["classrooms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_class_sessions_classroom_id", "class_sessions", ["classroom_id"])
    op.create_index("ix_class_sessions_scheduled_at", "class_sessions", ["scheduled_at"])
    op.create_index("ix_class_sessions_status", "class_sessions", ["status"])


def downgrade():
    op.drop_index("ix_class_sessions_status", table_name="class_sessions")
    op.drop_index("ix_class_sessions_scheduled_at", table_name="class_sessions")
    op.drop_index("ix_class_sessions_classroom_id", table_name="class_sessions")
    op.drop_table("class_sessions")
