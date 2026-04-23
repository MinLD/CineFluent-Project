"""fix homework assignment scope to classroom

Revision ID: e6f42b19c8aa
Revises: d4c31b8e9a12
Create Date: 2026-04-23 20:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "e6f42b19c8aa"
down_revision = "d4c31b8e9a12"
branch_labels = None
depends_on = None


def _get_foreign_key_name(inspector, table_name, constrained_column):
    for fk in inspector.get_foreign_keys(table_name):
        columns = fk.get("constrained_columns") or []
        if constrained_column in columns:
            return fk.get("name")
    return None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("class_session_assignments")}

    if "classroom_id" not in columns:
        op.add_column(
            "class_session_assignments",
            sa.Column("classroom_id", sa.Integer(), nullable=True),
        )

    columns = {column["name"] for column in inspector.get_columns("class_session_assignments")}
    indexes = {index["name"] for index in inspector.get_indexes("class_session_assignments")}

    if "session_id" in columns:
        op.execute(
            """
            UPDATE class_session_assignments csa
            JOIN class_sessions cs ON cs.id = csa.session_id
            SET csa.classroom_id = cs.classroom_id
            WHERE csa.classroom_id IS NULL
            """
        )

        fk_name = _get_foreign_key_name(inspector, "class_session_assignments", "session_id")
        if fk_name:
            op.drop_constraint(fk_name, "class_session_assignments", type_="foreignkey")

        if "ix_class_session_assignments_session_id" in indexes:
            op.drop_index("ix_class_session_assignments_session_id", table_name="class_session_assignments")

        op.alter_column(
            "class_session_assignments",
            "classroom_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
        op.create_foreign_key(
            "fk_class_session_assignments_classroom_id_classrooms",
            "class_session_assignments",
            "classrooms",
            ["classroom_id"],
            ["id"],
            ondelete="CASCADE",
        )

        refreshed_columns = {column["name"] for column in inspect(bind).get_columns("class_session_assignments")}
        if "session_id" in refreshed_columns:
            op.drop_column("class_session_assignments", "session_id")
    else:
        fk_name = _get_foreign_key_name(inspector, "class_session_assignments", "classroom_id")
        if not fk_name:
            op.create_foreign_key(
                "fk_class_session_assignments_classroom_id_classrooms",
                "class_session_assignments",
                "classrooms",
                ["classroom_id"],
                ["id"],
                ondelete="CASCADE",
            )
        op.alter_column(
            "class_session_assignments",
            "classroom_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

    refreshed_indexes = {index["name"] for index in inspect(bind).get_indexes("class_session_assignments")}
    if "ix_class_session_assignments_classroom_id" not in refreshed_indexes:
        op.create_index(
            "ix_class_session_assignments_classroom_id",
            "class_session_assignments",
            ["classroom_id"],
        )


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("class_session_assignments")}
    indexes = {index["name"] for index in inspector.get_indexes("class_session_assignments")}

    if "session_id" not in columns:
        op.add_column(
            "class_session_assignments",
            sa.Column("session_id", sa.Integer(), nullable=True),
        )
        op.execute(
            """
            UPDATE class_session_assignments csa
            JOIN class_sessions cs ON cs.classroom_id = csa.classroom_id
            SET csa.session_id = cs.id
            WHERE csa.session_id IS NULL
            """
        )
        op.alter_column(
            "class_session_assignments",
            "session_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
        op.create_foreign_key(
            "fk_class_session_assignments_session_id_class_sessions",
            "class_session_assignments",
            "class_sessions",
            ["session_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index(
            "ix_class_session_assignments_session_id",
            "class_session_assignments",
            ["session_id"],
        )

    fk_name = _get_foreign_key_name(inspector, "class_session_assignments", "classroom_id")
    if fk_name:
        op.drop_constraint(fk_name, "class_session_assignments", type_="foreignkey")

    if "ix_class_session_assignments_classroom_id" in indexes:
        op.drop_index("ix_class_session_assignments_classroom_id", table_name="class_session_assignments")

    refreshed_columns = {column["name"] for column in inspect(bind).get_columns("class_session_assignments")}
    if "classroom_id" in refreshed_columns:
        op.drop_column("class_session_assignments", "classroom_id")
