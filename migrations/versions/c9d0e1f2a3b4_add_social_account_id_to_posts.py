"""add social_account_id to posts

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-06-06 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c9d0e1f2a3b4'
down_revision = 'b8c9d0e1f2a3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('posts', sa.Column('social_account_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_posts_social_account_id', 'posts', 'social_accounts', ['social_account_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_posts_social_account_id', 'posts', type_='foreignkey')
    op.drop_column('posts', 'social_account_id')
