"""add classroom core tables

Revision ID: e4b7c2d9a831
Revises: d1f42ab93c10
Create Date: 2026-04-23 16:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e4b7c2d9a831"
down_revision = "d1f42ab93c10"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "classrooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("teacher_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("invite_code", sa.String(length=16), nullable=False),
        sa.Column("status", sa.Enum("ACTIVE", "ARCHIVED"), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["teacher_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invite_code"),
    )
    op.create_index(op.f("ix_classrooms_teacher_id"), "classrooms", ["teacher_id"], unique=False)
    op.create_index(op.f("ix_classrooms_invite_code"), "classrooms", ["invite_code"], unique=True)
    op.create_index(op.f("ix_classrooms_status"), "classrooms", ["status"], unique=False)

    op.create_table(
        "classroom_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.Enum("teacher", "student"), nullable=False, server_default="student"),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["classroom_id"], ["classrooms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("classroom_id", "user_id", name="uq_classroom_member"),
    )
    op.create_index(op.f("ix_classroom_members_classroom_id"), "classroom_members", ["classroom_id"], unique=False)
    op.create_index(op.f("ix_classroom_members_user_id"), "classroom_members", ["user_id"], unique=False)
    op.create_index(op.f("ix_classroom_members_role"), "classroom_members", ["role"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_classroom_members_role"), table_name="classroom_members")
    op.drop_index(op.f("ix_classroom_members_user_id"), table_name="classroom_members")
    op.drop_index(op.f("ix_classroom_members_classroom_id"), table_name="classroom_members")
    op.drop_table("classroom_members")

    op.drop_index(op.f("ix_classrooms_status"), table_name="classrooms")
    op.drop_index(op.f("ix_classrooms_invite_code"), table_name="classrooms")
    op.drop_index(op.f("ix_classrooms_teacher_id"), table_name="classrooms")
    op.drop_table("classrooms")
