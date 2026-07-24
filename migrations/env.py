from logging.config import fileConfig
from app.db.models import (
    ContentGeneration,
    ContentCandidate,
    Post,
    SocialAccount
)
from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import settings
from app.db.base import Base

# Important: importing models registers them with Base.metadata
from app.db.models import ContentGeneration, ContentCandidate, Post, SocialAccount


config = context.config


# Alembic uses the synchronous PostgreSQL driver.
# The FastAPI application itself continues using asyncpg.
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL.replace(
        "+asyncpg",
        "",
    ),
)


# Configure Alembic logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# SQLAlchemy metadata used by Alembic autogenerate
target_metadata = Base.metadata


def run_migrations_offline():

    url = config.get_main_option(
        "sqlalchemy.url"
    )

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():

    configuration = config.get_section(
        config.config_ini_section
    )

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()