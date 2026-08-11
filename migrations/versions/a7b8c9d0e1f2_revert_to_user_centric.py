"""revert to user-centric social accounts and drop workspace/brand

Revision ID: a7b8c9d0e1f2
Revises: f1a2b3c4d5e6
Create Date: 2026-06-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a7b8c9d0e1f2'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Add user_id back to social_accounts, content_generations, posts if not present
    op.add_column('social_accounts', sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('content_generations', sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('posts', sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True))

    # 2. Populate user_id from brands -> workspaces -> owner_id
    conn.execute(sa.text("""
        UPDATE social_accounts sa
        SET user_id = w.owner_id
        FROM brands b
        JOIN workspaces w ON b.workspace_id = w.id
        WHERE sa.brand_id = b.id
    """))

    conn.execute(sa.text("""
        UPDATE content_generations cg
        SET user_id = w.owner_id
        FROM brands b
        JOIN workspaces w ON b.workspace_id = w.id
        WHERE cg.brand_id = b.id
    """))

    conn.execute(sa.text("""
        UPDATE posts p
        SET user_id = w.owner_id
        FROM brands b
        JOIN workspaces w ON b.workspace_id = w.id
        WHERE p.brand_id = b.id
    """))

    # Fallback if any remain null, assign to first user
    first_user = conn.execute(sa.text("SELECT id FROM users LIMIT 1")).fetchone()
    if first_user:
        fu_id = first_user[0]
        conn.execute(sa.text("UPDATE social_accounts SET user_id = :uid WHERE user_id IS NULL"), {"uid": fu_id})
        conn.execute(sa.text("UPDATE content_generations SET user_id = :uid WHERE user_id IS NULL"), {"uid": fu_id})
        conn.execute(sa.text("UPDATE posts SET user_id = :uid WHERE user_id IS NULL"), {"uid": fu_id})

    # Make user_id NOT NULL and add foreign keys & indexes
    op.alter_column('social_accounts', 'user_id', nullable=False)
    op.alter_column('content_generations', 'user_id', nullable=False)
    op.alter_column('posts', 'user_id', nullable=False)

    op.create_foreign_key('fk_social_accounts_user_id', 'social_accounts', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_content_generations_user_id', 'content_generations', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_posts_user_id', 'posts', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    op.create_index(op.f('ix_social_accounts_user_id'), 'social_accounts', ['user_id'], unique=False)
    op.create_index(op.f('ix_content_generations_user_id'), 'content_generations', ['user_id'], unique=False)
    op.create_index(op.f('ix_posts_user_id'), 'posts', ['user_id'], unique=False)

    # Drop social_account_id column from posts if exists
    try:
        op.drop_constraint('fk_posts_social_account_id', 'posts', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_column('posts', 'social_account_id')
    except Exception:
        pass

    op.drop_index('ix_social_accounts_brand_id', table_name='social_accounts')
    op.drop_column('social_accounts', 'brand_id')

    op.drop_index('ix_content_generations_brand_id', table_name='content_generations')
    op.drop_column('content_generations', 'brand_id')

    op.drop_index('ix_posts_brand_id', table_name='posts')
    op.drop_column('posts', 'brand_id')

    # Drop brands and workspaces tables
    op.drop_table('brands')
    op.drop_table('workspaces')


def downgrade() -> None:
    pass
