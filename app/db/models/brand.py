import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    tone: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        default="Professional, engaging, authoritative",
    )

    target_audience: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Professionals, founders, and creators",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    workspace = relationship(
        "Workspace",
        back_populates="brands",
        lazy="selectin",
    )

    social_accounts = relationship(
        "SocialAccount",
        back_populates="brand",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    generations = relationship(
        "ContentGeneration",
        back_populates="brand",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    posts = relationship(
        "Post",
        back_populates="brand",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
