"""add grammar lessons and reviews tables

Revision ID: d1f42ab93c10
Revises: c7a9f18e4d21
Create Date: 2026-04-23 15:25:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d1f42ab93c10"
down_revision = "c7a9f18e4d21"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "grammar_lessons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content_json", sa.JSON(), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False, server_default="gemini-2.5-flash"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tag_id"], ["grammar_tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tag_id"),
    )
    op.create_index(op.f("ix_grammar_lessons_tag_id"), "grammar_lessons", ["tag_id"], unique=True)

    op.create_table(
        "grammar_review_exercises",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("question_count", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("quiz_data", sa.JSON(), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False, server_default="gemini-2.5-flash"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["tag_id"], ["grammar_tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_grammar_review_exercises_tag_id"), "grammar_review_exercises", ["tag_id"], unique=False)

    op.create_table(
        "grammar_review_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("review_exercise_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("user_answers", sa.JSON(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct_answers", sa.Integer(), nullable=True),
        sa.Column("status", sa.Enum("PENDING", "COMPLETED"), nullable=False, server_default="PENDING"),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["review_exercise_id"], ["grammar_review_exercises.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_grammar_review_attempts_review_exercise_id"), "grammar_review_attempts", ["review_exercise_id"], unique=False)
    op.create_index(op.f("ix_grammar_review_attempts_user_id"), "grammar_review_attempts", ["user_id"], unique=False)
    op.create_index(op.f("ix_grammar_review_attempts_status"), "grammar_review_attempts", ["status"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_grammar_review_attempts_status"), table_name="grammar_review_attempts")
    op.drop_index(op.f("ix_grammar_review_attempts_user_id"), table_name="grammar_review_attempts")
    op.drop_index(op.f("ix_grammar_review_attempts_review_exercise_id"), table_name="grammar_review_attempts")
    op.drop_table("grammar_review_attempts")

    op.drop_index(op.f("ix_grammar_review_exercises_tag_id"), table_name="grammar_review_exercises")
    op.drop_table("grammar_review_exercises")

    op.drop_index(op.f("ix_grammar_lessons_tag_id"), table_name="grammar_lessons")
    op.drop_table("grammar_lessons")
