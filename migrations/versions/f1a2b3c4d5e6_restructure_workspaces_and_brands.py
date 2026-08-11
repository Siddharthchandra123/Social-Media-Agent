"""restructure workspaces and brands

Revision ID: f1a2b3c4d5e6
Revises: 0fe941198ce7
Create Date: 2026-06-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'd4e87e308b12'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create workspaces table
    op.create_table(
        'workspaces',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_workspaces_owner_id'), 'workspaces', ['owner_id'], unique=False)

    # 2. Create brands table
    op.create_table(
        'brands',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('tone', sa.String(length=200), nullable=False, server_default='Professional, engaging, authoritative'),
        sa.Column('target_audience', sa.Text(), nullable=False, server_default='Professionals, founders, and creators'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_brands_workspace_id'), 'brands', ['workspace_id'], unique=False)

    # 3. Add brand_id to social_accounts, content_generations, posts
    # Social Accounts
    op.add_column('social_accounts', sa.Column('brand_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f('ix_social_accounts_brand_id'), 'social_accounts', ['brand_id'], unique=False)

    # Content Generations
    op.add_column('content_generations', sa.Column('brand_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f('ix_content_generations_brand_id'), 'content_generations', ['brand_id'], unique=False)

    # Posts
    op.add_column('posts', sa.Column('brand_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('posts', sa.Column('social_account_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f('ix_posts_brand_id'), 'posts', ['brand_id'], unique=False)
    op.create_foreign_key('fk_posts_social_account_id', 'posts', 'social_accounts', ['social_account_id'], ['id'])

    # Data Migration for existing records: create a default workspace & brand for every existing user, and link existing tables
    conn = op.get_bind()
    users = conn.execute(sa.text("SELECT id, name FROM users")).fetchall()
    for user in users:
        user_id = user[0]
        user_name = user[1] or "User"
        
        # create workspace
        ws_id = postgresql.UUID(as_uuid=True)
        import uuid
        ws_id_val = uuid.uuid4()
        conn.execute(
            sa.text("INSERT INTO workspaces (id, name, owner_id) VALUES (:id, :name, :owner_id)"),
            {"id": ws_id_val, "name": f"{user_name}'s Workspace", "owner_id": user_id}
        )

        # create default brand
        brand_id_val = uuid.uuid4()
        conn.execute(
            sa.text("INSERT INTO brands (id, workspace_id, name) VALUES (:id, :workspace_id, :name)"),
            {"id": brand_id_val, "workspace_id": ws_id_val, "name": "Default Brand"}
        )

        # update social_accounts
        conn.execute(
            sa.text("UPDATE social_accounts SET brand_id = :brand_id WHERE user_id = :user_id AND brand_id IS NULL"),
            {"brand_id": brand_id_val, "user_id": user_id}
        )

        # update content_generations
        conn.execute(
            sa.text("UPDATE content_generations SET brand_id = :brand_id WHERE user_id = :user_id AND brand_id IS NULL"),
            {"brand_id": brand_id_val, "user_id": user_id}
        )

        # update posts
        conn.execute(
            sa.text("UPDATE posts SET brand_id = :brand_id WHERE user_id = :user_id AND brand_id IS NULL"),
            {"brand_id": brand_id_val, "user_id": user_id}
        )

    # For any orphan rows without user_id, create a fallback global workspace/brand or assign to first user/admin if any exist, or create system default
    fallback_brand = conn.execute(sa.text("SELECT id FROM brands LIMIT 1")).fetchone()
    if fallback_brand:
        fallback_brand_id = fallback_brand[0]
        conn.execute(sa.text("UPDATE social_accounts SET brand_id = :brand_id WHERE brand_id IS NULL"), {"brand_id": fallback_brand_id})
        conn.execute(sa.text("UPDATE content_generations SET brand_id = :brand_id WHERE brand_id IS NULL"), {"brand_id": fallback_brand_id})
        conn.execute(sa.text("UPDATE posts SET brand_id = :brand_id WHERE brand_id IS NULL"), {"brand_id": fallback_brand_id})

    # Now make brand_id NOT NULL on social_accounts, content_generations, posts
    op.alter_column('social_accounts', 'brand_id', nullable=False)
    op.alter_column('content_generations', 'brand_id', nullable=False)
    op.alter_column('posts', 'brand_id', nullable=False)

    # Drop old user_id columns if desired or leave foreign keys (or drop user_id from social_accounts, content_generations, posts)
    op.drop_constraint('social_accounts_user_id_fkey', 'social_accounts', type_='foreignkey')
    op.drop_column('social_accounts', 'user_id')

    op.drop_constraint('content_generations_user_id_fkey', 'content_generations', type_='foreignkey')
    op.drop_column('content_generations', 'user_id')

    op.drop_constraint('posts_user_id_fkey', 'posts', type_='foreignkey')
    op.drop_column('posts', 'user_id')


def downgrade() -> None:
    # Downgrade path if needed
    pass
