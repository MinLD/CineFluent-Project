"""add movie ai analyses table

Revision ID: 6f4c1b2d9a10
Revises: 34b437216bbb
Create Date: 2026-03-24 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6f4c1b2d9a10'
down_revision = '34b437216bbb'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'movie_ai_analyses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('video_id', sa.Integer(), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('model_mode', sa.String(length=50), nullable=False),
        sa.Column('segment_count', sa.Integer(), nullable=False),
        sa.Column('movie_score', sa.Float(), nullable=False),
        sa.Column('movie_level', sa.String(length=50), nullable=False),
        sa.Column('movie_cefr_range', sa.String(length=20), nullable=False),
        sa.Column('difficulty_ratios', sa.JSON(), nullable=False),
        sa.Column('cefr_ratios', sa.JSON(), nullable=False),
        sa.Column('dominant_grammar_tags', sa.JSON(), nullable=True),
        sa.Column('top_hard_segments', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('READY', 'FAILED'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('video_id'),
    )
    with op.batch_alter_table('movie_ai_analyses', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_movie_ai_analyses_status'), ['status'], unique=False)
        batch_op.create_index(batch_op.f('ix_movie_ai_analyses_video_id'), ['video_id'], unique=False)


def downgrade():
    with op.batch_alter_table('movie_ai_analyses', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_movie_ai_analyses_video_id'))
        batch_op.drop_index(batch_op.f('ix_movie_ai_analyses_status'))

    op.drop_table('movie_ai_analyses')
