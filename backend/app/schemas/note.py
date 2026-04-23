from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List


class AttachmentResponse(BaseModel):
    id: UUID
    file_type: str
    file_path: str
    original_name: str
    file_size: int


class TagResponse(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class NoteResponse(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    tags: List[TagResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    content: str


class NoteListResponse(BaseModel):
    notes: List[NoteResponse]
    has_more: bool
