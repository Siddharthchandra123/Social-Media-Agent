import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ContentGeneration(Base):
    __tablename__ = "content_generations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    platform: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    topic: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    objective: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    tone: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    audience: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="processing",
    )

    recommended_candidate_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
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

    candidates = relationship(
        "ContentCandidate",
        back_populates="generation",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
