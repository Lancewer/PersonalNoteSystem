from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..schemas.note import NoteCreate, NoteResponse, NoteListResponse
from ..services.note_service import (
    create_note,
    get_notes_by_user,
    get_note_by_id,
    update_note,
    delete_note,
)

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_new_note(
    request: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_note(db, current_user.id, request.content)


@router.get("", response_model=NoteListResponse)
def list_notes(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_notes_by_user(db, current_user.id, skip, limit)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = get_note_by_id(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_existing_note(
    note_id: UUID,
    request: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = update_note(db, note_id, current_user.id, request.content)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not delete_note(db, note_id, current_user.id):
        raise HTTPException(status_code=404, detail="Note not found")
