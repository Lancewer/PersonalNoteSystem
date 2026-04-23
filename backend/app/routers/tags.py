from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..schemas.tag import TagCreate, TagTreeNode
from ..services.tag_service import create_tag, get_tag_tree, get_notes_by_tag
from ..services.note_service import PAGE_SIZE

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.post("", response_model=TagTreeNode, status_code=status.HTTP_201_CREATED)
def create_new_tag(
    request: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_tag(db, current_user.id, request.name, request.parent_id)


@router.get("", response_model=list[TagTreeNode])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_tag_tree(db, current_user.id)


@router.get("/{tag_id}/notes")
def get_tag_notes(
    tag_id: UUID,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = get_notes_by_tag(db, current_user.id, tag_id, skip, PAGE_SIZE)
    has_more = len(notes) > PAGE_SIZE
    if has_more:
        notes = notes[:-1]
    return {"notes": notes, "has_more": has_more}
