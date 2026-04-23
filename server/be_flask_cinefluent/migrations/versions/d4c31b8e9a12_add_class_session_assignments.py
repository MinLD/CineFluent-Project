"""add class session assignments

Revision ID: d4c31b8e9a12
Revises: b9e02a71f4c8
Create Date: 2026-04-23 21:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "d4c31b8e9a12"
down_revision = "b9e02a71f4c8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "class_session_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("source_video_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("grammar_focus", sa.JSON(), nullable=True),
        sa.Column("question_count", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("quiz_data", sa.JSON(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "CLOSED"),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["classroom_id"], ["classrooms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_video_id"], ["videos.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_class_session_assignments_classroom_id", "class_session_assignments", ["classroom_id"])
    op.create_index("ix_class_session_assignments_created_by", "class_session_assignments", ["created_by"])
    op.create_index("ix_class_session_assignments_source_video_id", "class_session_assignments", ["source_video_id"])
    op.create_index("ix_class_session_assignments_status", "class_session_assignments", ["status"])

    op.create_table(
        "class_session_assignment_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assignment_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct_answers", sa.Integer(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["class_session_assignments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assignment_id", "user_id", name="uq_class_assignment_submission"),
    )
    op.create_index(
        "ix_class_session_assignment_submissions_assignment_id",
        "class_session_assignment_submissions",
        ["assignment_id"],
    )
    op.create_index(
        "ix_class_session_assignment_submissions_user_id",
        "class_session_assignment_submissions",
        ["user_id"],
    )


def downgrade():
    op.drop_index(
        "ix_class_session_assignment_submissions_user_id",
        table_name="class_session_assignment_submissions",
    )
    op.drop_index(
        "ix_class_session_assignment_submissions_assignment_id",
        table_name="class_session_assignment_submissions",
    )
    op.drop_table("class_session_assignment_submissions")

    op.drop_index("ix_class_session_assignments_status", table_name="class_session_assignments")
    op.drop_index("ix_class_session_assignments_source_video_id", table_name="class_session_assignments")
    op.drop_index("ix_class_session_assignments_created_by", table_name="class_session_assignments")
    op.drop_index("ix_class_session_assignments_classroom_id", table_name="class_session_assignments")
    op.drop_table("class_session_assignments")
