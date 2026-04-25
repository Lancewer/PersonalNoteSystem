from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List


class TagCreate(BaseModel):
    name: str
    parent_id: Optional[UUID] = None


class TagTreeNode(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID] = None
    children: List["TagTreeNode"] = []
    note_count: int = 0

    class Config:
        from_attributes = True
