from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from ..database import Base
import enum


class FileType(str, enum.Enum):
    image = "image"
    audio = "audio"
    file = "file"


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    note_id = Column(
        UUID(as_uuid=True), ForeignKey("notes.id"), nullable=False, index=True
    )
    file_type = Column(String(10), nullable=False)
    file_path = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    note = relationship("Note", back_populates="attachments")
