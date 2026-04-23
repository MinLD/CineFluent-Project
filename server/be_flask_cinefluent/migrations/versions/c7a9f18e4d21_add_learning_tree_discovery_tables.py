"""add learning tree discovery tables

Revision ID: c7a9f18e4d21
Revises: f2b8d3c4a1e5
Create Date: 2026-04-23 15:40:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7a9f18e4d21'
down_revision = 'f2b8d3c4a1e5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'grammar_branches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name_en', sa.String(length=100), nullable=False),
        sa.Column('name_vi', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
    )

    with op.batch_alter_table('grammar_branches', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_grammar_branches_name_en'), ['name_en'], unique=True)

    op.bulk_insert(
        sa.table(
            'grammar_branches',
            sa.column('id', sa.Integer),
            sa.column('name_en', sa.String),
            sa.column('name_vi', sa.String),
            sa.column('description', sa.Text),
            sa.column('display_order', sa.Integer),
        ),
        [
            {
                'id': 1,
                'name_en': 'present_tenses',
                'name_vi': 'Hiện tại',
                'description': 'Các thì hiện tại dùng trong ngữ cảnh giao tiếp thường ngày.',
                'display_order': 1,
            },
            {
                'id': 2,
                'name_en': 'past_tenses',
                'name_vi': 'Quá khứ',
                'description': 'Các thì quá khứ xuất hiện trong hội thoại phim.',
                'display_order': 2,
            },
            {
                'id': 3,
                'name_en': 'future_tenses',
                'name_vi': 'Tương lai',
                'description': 'Các thì tương lai mà người học khám phá qua phim.',
                'display_order': 3,
            },
        ],
    )

    with op.batch_alter_table('grammar_tags', schema=None) as batch_op:
        batch_op.add_column(sa.Column('branch_id', sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f('ix_grammar_tags_branch_id'), ['branch_id'], unique=False)
        batch_op.create_foreign_key('fk_grammar_tags_branch_id', 'grammar_branches', ['branch_id'], ['id'])

    op.execute("UPDATE grammar_tags SET branch_id = 3 WHERE id BETWEEN 0 AND 3")
    op.execute("UPDATE grammar_tags SET branch_id = 2 WHERE id BETWEEN 4 AND 7")
    op.execute("UPDATE grammar_tags SET branch_id = 1 WHERE id BETWEEN 8 AND 11")

    op.create_table(
        'user_discovered_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False, server_default='movie'),
        sa.Column('encounter_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('discovered_at', sa.DateTime(), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tag_id'], ['grammar_tags.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'tag_id', name='uq_user_discovered_tag'),
    )

    with op.batch_alter_table('user_discovered_tags', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_discovered_tags_tag_id'), ['tag_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_user_discovered_tags_user_id'), ['user_id'], unique=False)

    op.execute(
        """
        INSERT INTO user_discovered_tags (
            user_id,
            tag_id,
            source,
            encounter_count,
            discovered_at,
            last_seen_at,
            created_at,
            updated_at
        )
        SELECT
            user_id,
            tag_id,
            'quiz',
            1,
            COALESCE(created_at, last_practiced_at, UTC_TIMESTAMP()),
            COALESCE(last_practiced_at, created_at, UTC_TIMESTAMP()),
            COALESCE(created_at, UTC_TIMESTAMP()),
            COALESCE(updated_at, UTC_TIMESTAMP())
        FROM user_tag_masteries
        WHERE NOT EXISTS (
            SELECT 1
            FROM user_discovered_tags udt
            WHERE udt.user_id = user_tag_masteries.user_id
              AND udt.tag_id = user_tag_masteries.tag_id
        )
        """
    )


def downgrade():
    with op.batch_alter_table('user_discovered_tags', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_discovered_tags_user_id'))
        batch_op.drop_index(batch_op.f('ix_user_discovered_tags_tag_id'))

    op.drop_table('user_discovered_tags')

    with op.batch_alter_table('grammar_tags', schema=None) as batch_op:
        batch_op.drop_constraint('fk_grammar_tags_branch_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_grammar_tags_branch_id'))
        batch_op.drop_column('branch_id')

    with op.batch_alter_table('grammar_branches', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_grammar_branches_name_en'))

    op.drop_table('grammar_branches')
