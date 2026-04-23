from sqlalchemy.orm import Session
from uuid import UUID
from ..models.tag import Tag, NoteTag
from ..models.note import Note
from ..schemas.tag import TagCreate, TagTreeNode


def create_tag(db: Session, user_id: UUID, name: str, parent_id: UUID = None) -> Tag:
    tag = Tag(user_id=user_id, name=name, parent_id=parent_id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def get_tag_tree(db: Session, user_id: UUID) -> list[TagTreeNode]:
    all_tags = db.query(Tag).filter(Tag.user_id == user_id).all()
    tag_dict = {
        str(tag.id): TagTreeNode(
            id=tag.id, name=tag.name, parent_id=tag.parent_id, children=[]
        )
        for tag in all_tags
    }

    roots = []
    for tag_id, node in tag_dict.items():
        if node.parent_id is None:
            roots.append(node)
        else:
            parent = tag_dict.get(str(node.parent_id))
            if parent:
                parent.children.append(node)
    return roots


def get_notes_by_tag(
    db: Session, user_id: UUID, tag_id: UUID, skip: int = 0, limit: int = 20
) -> list:
    child_ids = get_all_child_tag_ids(db, tag_id)
    child_ids.append(tag_id)

    notes = (
        db.query(Note)
        .join(NoteTag, Note.id == NoteTag.note_id)
        .filter(NoteTag.tag_id.in_(child_ids), Note.user_id == user_id)
        .order_by(Note.created_at.desc())
        .offset(skip)
        .limit(limit + 1)
        .all()
    )
    return notes


def get_all_child_tag_ids(db: Session, tag_id: UUID) -> list[UUID]:
    children = db.query(Tag.id).filter(Tag.parent_id == tag_id).all()
    ids = [c[0] for c in children]
    for child_id in ids:
        ids.extend(get_all_child_tag_ids(db, child_id))
    return ids
