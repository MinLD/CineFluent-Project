"""add indexes for admin dashboard queries

Revision ID: a7c1d9e4b2f3
Revises: 6f4c1b2d9a10
Create Date: 2026-04-11 12:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "a7c1d9e4b2f3"
down_revision = "6f4c1b2d9a10"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("ix_users_created_at", "users", ["created_at"], unique=False)
    op.create_index("ix_user_profile_is_online", "user_profile", ["is_online"], unique=False)
    op.create_index(
        "ix_movie_requests_status_created_at",
        "movie_requests",
        ["status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_video_reports_status_created_at",
        "video_reports",
        ["status", "created_at"],
        unique=False,
    )
    op.create_index("ix_watch_history_watched_at", "watch_history", ["watched_at"], unique=False)


def downgrade():
    op.drop_index("ix_watch_history_watched_at", table_name="watch_history")
    op.drop_index("ix_video_reports_status_created_at", table_name="video_reports")
    op.drop_index("ix_movie_requests_status_created_at", table_name="movie_requests")
    op.drop_index("ix_user_profile_is_online", table_name="user_profile")
    op.drop_index("ix_users_created_at", table_name="users")
