import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ContentCandidate(Base):
    __tablename__ = "content_candidates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    generation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "content_generations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    hook: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    caption: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    cta: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    hashtags: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
    )

    content_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    suggested_media: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    hook_score: Mapped[int] = mapped_column(Integer, nullable=False)
    relevance_score: Mapped[int] = mapped_column(Integer, nullable=False)
    brand_score: Mapped[int] = mapped_column(Integer, nullable=False)
    readability_score: Mapped[int] = mapped_column(Integer, nullable=False)
    cta_score: Mapped[int] = mapped_column(Integer, nullable=False)
    platform_score: Mapped[int] = mapped_column(Integer, nullable=False)

    total_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    rank: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    evaluation_explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    generation = relationship(
        "ContentGeneration",
        back_populates="candidates",
    )