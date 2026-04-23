from sqlalchemy.orm import Session
from uuid import UUID
import re
from ..models.note import Note
from ..models.tag import Tag, NoteTag
from ..schemas.note import NoteCreate, NoteResponse, NoteListResponse

PAGE_SIZE = 20


def create_note(db: Session, user_id: UUID, content: str) -> Note:
    note = Note(user_id=user_id, content=content)
    db.add(note)
    db.flush()

    tags = extract_tags(content)
    for tag_name in tags:
        tag = get_or_create_tag(db, user_id, tag_name)
        note_tag = NoteTag(note_id=note.id, tag_id=tag.id)
        db.add(note_tag)

    db.commit()
    db.refresh(note)
    return note


def get_notes_by_user(
    db: Session, user_id: UUID, skip: int = 0, limit: int = PAGE_SIZE
) -> NoteListResponse:
    query = (
        db.query(Note).filter(Note.user_id == user_id).order_by(Note.created_at.desc())
    )
    total = query.count()
    notes = query.offset(skip).limit(limit + 1).all()
    has_more = len(notes) > limit
    if has_more:
        notes = notes[:-1]
    return NoteListResponse(notes=notes, has_more=has_more)


def get_note_by_id(db: Session, note_id: UUID, user_id: UUID) -> Note:
    return db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()


def update_note(db: Session, note_id: UUID, user_id: UUID, content: str) -> Note:
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        return None
    note.content = content
    db.query(NoteTag).filter(NoteTag.note_id == note_id).delete()
    tags = extract_tags(content)
    for tag_name in tags:
        tag = get_or_create_tag(db, user_id, tag_name)
        db.add(NoteTag(note_id=note_id, tag_id=tag.id))
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note_id: UUID, user_id: UUID) -> bool:
    note = get_note_by_id(db, note_id, user_id)
    if not note:
        return False
    db.delete(note)
    db.commit()
    return True


def extract_tags(content: str) -> list[str]:
    return list(set(re.findall(r"#([\w\u4e00-\u9fff/]+)", content)))


def get_or_create_tag(db: Session, user_id: UUID, full_path: str) -> Tag:
    parts = full_path.split("/")
    parent = None
    for part in parts:
        tag = (
            db.query(Tag)
            .filter(
                Tag.user_id == user_id,
                Tag.name == part,
                Tag.parent_id == (parent.id if parent else None),
            )
            .first()
        )
        if not tag:
            tag = Tag(
                user_id=user_id,
                name=part,
                parent_id=parent.id if parent else None,
            )
            db.add(tag)
            db.flush()
        parent = tag
    return parent
