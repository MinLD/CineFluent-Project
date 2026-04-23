"""add class session recordings and recaps

Revision ID: b9e02a71f4c8
Revises: a8c34f02d7b6
Create Date: 2026-04-23 14:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "b9e02a71f4c8"
down_revision = "a8c34f02d7b6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "class_session_recordings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("uploaded_by", sa.String(length=36), nullable=True),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("UPLOADED", "PROCESSED", "FAILED"),
            nullable=False,
            server_default="UPLOADED",
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["class_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_class_session_recordings_session_id", "class_session_recordings", ["session_id"])
    op.create_index("ix_class_session_recordings_uploaded_by", "class_session_recordings", ["uploaded_by"])
    op.create_index("ix_class_session_recordings_status", "class_session_recordings", ["status"])

    op.create_table(
        "class_session_recaps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("recording_id", sa.Integer(), nullable=True),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("key_points", sa.JSON(), nullable=True),
        sa.Column("examples", sa.JSON(), nullable=True),
        sa.Column("homework_text", sa.Text(), nullable=True),
        sa.Column("review_suggestions", sa.JSON(), nullable=True),
        sa.Column("transcript_text", sa.Text(), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["recording_id"], ["class_session_recordings.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["session_id"], ["class_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )
    op.create_index("ix_class_session_recaps_session_id", "class_session_recaps", ["session_id"])
    op.create_index("ix_class_session_recaps_recording_id", "class_session_recaps", ["recording_id"])


def downgrade():
    op.drop_index("ix_class_session_recaps_recording_id", table_name="class_session_recaps")
    op.drop_index("ix_class_session_recaps_session_id", table_name="class_session_recaps")
    op.drop_table("class_session_recaps")

    op.drop_index("ix_class_session_recordings_status", table_name="class_session_recordings")
    op.drop_index("ix_class_session_recordings_uploaded_by", table_name="class_session_recordings")
    op.drop_index("ix_class_session_recordings_session_id", table_name="class_session_recordings")
    op.drop_table("class_session_recordings")
