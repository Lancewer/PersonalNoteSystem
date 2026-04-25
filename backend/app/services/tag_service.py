from sqlalchemy.orm import Session
from sqlalchemy import func
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

    tag_counts = dict(
        db.query(NoteTag.tag_id, func.count(NoteTag.note_id))
        .join(Tag, NoteTag.tag_id == Tag.id)
        .filter(Tag.user_id == user_id)
        .group_by(NoteTag.tag_id)
        .all()
    )

    tag_dict = {
        str(tag.id): TagTreeNode(
            id=tag.id,
            name=tag.name,
            parent_id=tag.parent_id,
            children=[],
            note_count=tag_counts.get(tag.id, 0),
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

    for root in roots:
        _update_total_counts(root)

    return roots


def _update_total_counts(node: TagTreeNode):
    for child in node.children:
        _update_total_counts(child)
    total = node.note_count
    for child in node.children:
        total += child.note_count
    node.note_count = total


def cleanup_orphan_tags(db: Session, user_id: UUID):
    while True:
        orphan_tags = (
            db.query(Tag)
            .outerjoin(NoteTag, Tag.id == NoteTag.tag_id)
            .filter(
                Tag.user_id == user_id,
                NoteTag.tag_id == None,
            )
            .all()
        )
        if not orphan_tags:
            break
        for tag in orphan_tags:
            db.delete(tag)
        db.commit()


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
    ids: list[UUID] = []
    queue = [tag_id]
    while queue:
        current_id = queue.pop(0)
        children = db.query(Tag.id).filter(Tag.parent_id == current_id).all()
        for (child_id,) in children:
            if child_id not in ids and child_id != tag_id:
                ids.append(child_id)
                queue.append(child_id)
    return ids
