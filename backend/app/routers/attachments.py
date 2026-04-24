from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID
import os
from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..models.note import Note
from ..models.attachment import Attachment
from ..config import settings
from ..services.storage_service import save_upload_file

router = APIRouter(prefix="/api", tags=["attachments"])


@router.post("/notes/{note_id}/attachments", status_code=201)
async def upload_attachment(
    note_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        result = await save_upload_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    attachment = Attachment(
        note_id=note_id,
        file_type=result["file_type"],
        file_path=result["file_path"],
        original_name=file.filename,
        file_size=result["file_size"],
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return {
        "id": attachment.id,
        "file_type": attachment.file_type,
        "file_path": attachment.file_path,
    }


@router.get("/attachments/{attachment_id}")
def download_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = (
        db.query(Attachment)
        .join(Note)
        .filter(Attachment.id == attachment_id, Note.user_id == current_user.id)
        .first()
    )
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    full_path = os.path.join(settings.UPLOAD_DIR, attachment.file_path)
    real_path = os.path.realpath(full_path)
    real_upload_dir = os.path.realpath(settings.UPLOAD_DIR)
    if not (
        real_path.startswith(real_upload_dir + os.sep) or real_path == real_upload_dir
    ):
        raise HTTPException(status_code=403, detail="Access denied")
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(full_path, filename=attachment.original_name)
